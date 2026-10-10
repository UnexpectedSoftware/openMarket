import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/filter';
import {aggregateId, hydrate, typeName} from '../event/registry';
import {DEAD, PENDING} from './domainEventStatus';

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_INTERVAL_MS = 1000;
const ERROR_LIMIT = 500;

/**
 * Delivers domain events to live listeners, synchronous handlers, and durable handlers.
 * Live listeners (ofType) see an event only after the publishing transaction commits.
 * Synchronous handlers run inside that transaction: a throw rolls it back.
 * Durable handlers are recorded as PENDING and retried until they succeed or are dead-lettered.
 * Without a store the bus stays in memory: synchronous throws still propagate, and durable handlers run once.
 */
export default class DomainEventBus {

  /**
   * @param {DomainEventStore} [store]
   * @param {function(): string} [now]
   * @param {number} [maxAttempts]
   * @param {number} [intervalMs]
   */
  constructor({store = null, now = null, maxAttempts = DEFAULT_MAX_ATTEMPTS, intervalMs = DEFAULT_INTERVAL_MS} = {}) {
    this._events = new Subject();
    this._store = store;
    this._now = now || (() => new Date().toISOString());
    this._maxAttempts = maxAttempts;
    this._intervalMs = intervalMs;
    this._sync = new Map();
    this._durable = new Map();
    this._deferred = [];
    this._draining = false;
    this._pumpAgain = false;
    this._timer = null;
  }

  /**
   * Persists the event when a store is configured, then runs synchronous handlers.
   * A synchronous throw propagates to the caller.
   * @param {*} event
   */
  publish(event) {
    if (event == null || typeof event !== 'object') {
      throw new Error('DomainEventBus#publish expects an event');
    }
    if (!this._store) {
      this._runSync(event);
      this._runDurableInline(event);
      this._events.next(event);
      return;
    }
    const record = {
      id: globalThis.crypto.randomUUID(),
      type: typeName(event),
      payload: JSON.stringify(event),
      aggregateId: aggregateId(event),
      createdAt: this._now()
    };
    const subscriberNames = this._durableNames(event);
    const owns = !this._store.inTransaction();
    if (owns) {
      this._store.begin();
    }
    const mark = this._deferred.length;
    try {
      this._store.insertEvent(record);
      this._runSync(event);
      this._store.insertPending({
        eventId: record.id,
        subscriberNames,
        updatedAt: record.createdAt
      });
      this._deferred.push(event);
      if (owns) {
        this._store.commit();
      }
    } catch (error) {
      this._deferred.splice(mark);
      if (owns) {
        this._store.rollback();
      }
      throw error;
    }
    if (owns) {
      this._emit(this._deferred.splice(mark));
    }
  }

  /**
   * @returns {Observable}
   */
  events() {
    return this._events.asObservable();
  }

  /**
   * Live listener. Events published inside a transaction are delivered after commit.
   * There is no replay.
   * @param {Function} EventType
   * @returns {Observable}
   */
  ofType(EventType) {
    return this.events().filter(event => event instanceof EventType);
  }

  /**
   * Runs inside the publishing transaction, before live listeners.
   * A throw aborts publish and rolls the transaction back.
   * @param {string} name
   * @param {Function} EventType
   * @param {function(*): void} handler
   * @returns {function(): void}
   */
  subscribeSync(name, EventType, handler) {
    this._assertSubscriber(name, EventType, handler);
    this._sync.set(name, {name, EventType, handler});
    return () => {
      const current = this._sync.get(name);
      if (current && current.handler === handler) {
        this._sync.delete(name);
      }
    };
  }

  /**
   * Recorded per event and retried after commit until success or dead-letter.
   * Delivery is at least once, in insertion order when ordered is true.
   * @param {string} name
   * @param {Function} EventType
   * @param {function(*): void} handler
   * @param {{ordered?: boolean, maxAttempts?: number}} [options]
   * @returns {function(): void}
   */
  subscribeDurable(name, EventType, handler, {ordered = true, maxAttempts = this._maxAttempts} = {}) {
    this._assertSubscriber(name, EventType, handler);
    this._durable.set(name, {
      name,
      EventType,
      handler,
      ordered: ordered !== false,
      maxAttempts: maxAttempts > 0 ? maxAttempts : this._maxAttempts
    });
    this._ensureTimer();
    return () => {
      const current = this._durable.get(name);
      if (current && current.handler === handler) {
        this._durable.delete(name);
      }
    };
  }

  /**
   * Resets rows left PROCESSING by a crash, then delivers what is waiting.
   */
  start() {
    this._recover();
    this.processPending();
    this._ensureTimer();
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * One retry of a failed row, then every pending row that can run.
   * A failed ordered subscriber stops before its later events.
   */
  processPending() {
    this._pump({retry: true});
  }

  /**
   * Called by the surrounding transaction after COMMIT.
   */
  transactionCommitted() {
    this._emit(this._deferred.splice(0));
  }

  /**
   * Called by the surrounding transaction after ROLLBACK.
   * Drops live notifications for events that were removed with the transaction.
   */
  transactionRolledBack() {
    this._deferred.length = 0;
  }

  _emit(events) {
    try {
      events.forEach(event => this._events.next(event));
    } finally {
      this._pump({retry: false});
    }
  }

  _runSync(event) {
    this._sync.forEach(subscriber => {
      if (event instanceof subscriber.EventType) {
        subscriber.handler(event);
      }
    });
  }

  _runDurableInline(event) {
    this._durable.forEach(subscriber => {
      if (!(event instanceof subscriber.EventType)) {
        return;
      }
      try {
        subscriber.handler(event);
      } catch (error) {
        // No store means there is nowhere to retry. Live delivery still happens.
      }
    });
  }

  _durableNames(event) {
    const names = [];
    this._durable.forEach(subscriber => {
      if (event instanceof subscriber.EventType) {
        names.push(subscriber.name);
      }
    });
    return names;
  }

  _recover() {
    if (!this._store) {
      return;
    }
    const updatedAt = this._now();
    this._store.listProcessing().forEach(row => {
      const subscriber = this._durable.get(row.subscriberName);
      const maxAttempts = subscriber ? subscriber.maxAttempts : this._maxAttempts;
      const dead = row.attempts >= maxAttempts;
      this._store.finishInterrupted({
        eventId: row.eventId,
        subscriberName: row.subscriberName,
        status: dead ? DEAD : PENDING,
        lastError: dead ? 'stopped while processing' : null,
        updatedAt
      });
    });
  }

  _ensureTimer() {
    if (this._timer || this._durable.size === 0 || !this._store) {
      return;
    }
    this._timer = setInterval(() => {
      try {
        this.processPending();
      } catch (error) {
        // A subscriber failure is stored on its row. The timer stays up.
      }
    }, this._intervalMs);
    if (typeof this._timer.unref === 'function') {
      this._timer.unref();
    }
  }

  _pump({retry}) {
    if (!this._store) {
      return;
    }
    if (this._store.inTransaction()) {
      return;
    }
    if (this._draining) {
      this._pumpAgain = true;
      return;
    }
    this._draining = true;
    try {
      let progressed = true;
      while (progressed || this._pumpAgain) {
        progressed = false;
        this._pumpAgain = false;
        this._durable.forEach(subscriber => {
          let allowRetry = retry;
          for (;;) {
            const outcome = this._dispatchNext(subscriber, {retry: allowRetry});
            allowRetry = false;
            if (outcome === 'done') {
              progressed = true;
              continue;
            }
            break;
          }
        });
        retry = false;
      }
    } finally {
      this._draining = false;
    }
  }

  _dispatchNext(subscriber, {retry}) {
    const row = this._store.nextFor({
      subscriberName: subscriber.name,
      ordered: subscriber.ordered,
      retry
    });
    if (!row) {
      return null;
    }
    const attempts = this._store.markProcessing({
      eventId: row.eventId,
      subscriberName: subscriber.name,
      updatedAt: this._now()
    });
    if (attempts == null) {
      return null;
    }
    let event;
    try {
      event = hydrate(row.type, JSON.parse(row.payload));
    } catch (error) {
      this._store.markFailed({
        eventId: row.eventId,
        subscriberName: subscriber.name,
        lastError: messageOf(error),
        dead: true,
        updatedAt: this._now()
      });
      return 'dead';
    }
    try {
      subscriber.handler(event);
    } catch (error) {
      const dead = attempts >= subscriber.maxAttempts;
      this._store.markFailed({
        eventId: row.eventId,
        subscriberName: subscriber.name,
        lastError: messageOf(error),
        dead,
        updatedAt: this._now()
      });
      return dead ? 'dead' : 'failed';
    }
    this._store.markDone({
      eventId: row.eventId,
      subscriberName: subscriber.name,
      updatedAt: this._now()
    });
    return 'done';
  }

  _assertSubscriber(name, EventType, handler) {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('Domain event subscriber name is required');
    }
    if (typeof EventType !== 'function') {
      throw new Error('Domain event subscriber type is required');
    }
    if (typeof handler !== 'function') {
      throw new Error('Domain event subscriber handler is required');
    }
  }

}

function messageOf(error) {
  const text = error instanceof Error ? error.message : String(error);
  return text.slice(0, ERROR_LIMIT);
}
