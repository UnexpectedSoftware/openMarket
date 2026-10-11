import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/filter';
import {aggregateId, hydrate, typeName} from '../event/registry';
import {DEAD, DONE, FAILED, PENDING, PROCESSING} from './domainEventStatus';

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_INTERVAL_MS = 1000;
const ERROR_LIMIT = 500;

/**
 * Delivers domain events to live listeners, synchronous handlers, and durable handlers.
 * Live listeners (ofType) see an event only after the publishing transaction commits.
 * Synchronous handlers run inside that transaction: a throw rolls it back.
 * Durable handlers are recorded as PENDING and retried until they succeed or are dead-lettered.
 */
export default class DomainEventBus {

  /**
   * @param {DomainEventRepository} repository
   * @param {Transaction} transaction
   * @param {Identity} identity
   * @param {Clock} clock
   * @param {number} [maxAttempts]
   * @param {number} [intervalMs]
   */
  constructor({
    repository,
    transaction,
    identity,
    clock,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    intervalMs = DEFAULT_INTERVAL_MS
  } = {}) {
    if (!repository || !transaction || !identity || !clock) {
      throw new Error('DomainEventBus requires a repository, a transaction, an identity, and a clock');
    }
    this._events = new Subject();
    this._repository = repository;
    this._transaction = transaction;
    this._identity = identity;
    this._clock = clock;
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
   * Persists the event, then runs synchronous handlers.
   * A synchronous throw propagates to the caller and rolls the transaction back.
   * @param {*} event
   */
  publish(event) {
    if (event == null || typeof event !== 'object') {
      throw new Error('DomainEventBus#publish expects an event');
    }
    const record = {
      id: this._identity.generate(),
      type: typeName(event),
      payload: JSON.stringify(event),
      aggregateId: aggregateId(event),
      createdAt: this._clock.now()
    };
    const subscriberNames = this._durableNames(event);
    const joined = this._transaction.inTransaction();
    const mark = this._deferred.length;
    try {
      this._transaction.execute(() => {
        this._repository.save(record);
        this._runSync(event);
        subscriberNames.forEach(subscriberName => {
          this._repository.saveProcessing({
            eventId: record.id,
            subscriberName,
            status: PENDING,
            attempts: 0,
            lastError: null,
            updatedAt: record.createdAt
          });
        });
        this._deferred.push(event);
      });
    } catch (error) {
      this._deferred.splice(mark);
      throw error;
    }
    if (!joined) {
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
    const updatedAt = this._clock.now();
    this._repository.findProcessingByStatus({status: PROCESSING}).forEach(row => {
      const subscriber = this._durable.get(row.subscriberName);
      const maxAttempts = subscriber ? subscriber.maxAttempts : this._maxAttempts;
      const dead = row.attempts >= maxAttempts;
      this._repository.saveProcessing({
        eventId: row.eventId,
        subscriberName: row.subscriberName,
        status: dead ? DEAD : PENDING,
        attempts: row.attempts,
        lastError: dead ? 'stopped while processing' : row.lastError,
        updatedAt
      });
    });
  }

  _ensureTimer() {
    if (this._timer || this._durable.size === 0) {
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
    if (this._transaction.inTransaction()) {
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
    const row = this._nextProcessing(subscriber, {retry});
    if (!row) {
      return null;
    }
    const attempts = row.attempts + 1;
    const updatedAt = this._clock.now();
    this._repository.saveProcessing({
      eventId: row.eventId,
      subscriberName: subscriber.name,
      status: PROCESSING,
      attempts,
      lastError: null,
      updatedAt
    });
    let event;
    try {
      event = hydrate(row.type, JSON.parse(row.payload));
    } catch (error) {
      this._repository.saveProcessing({
        eventId: row.eventId,
        subscriberName: subscriber.name,
        status: DEAD,
        attempts,
        lastError: messageOf(error),
        updatedAt: this._clock.now()
      });
      return 'dead';
    }
    try {
      subscriber.handler(event);
    } catch (error) {
      const dead = attempts >= subscriber.maxAttempts;
      this._repository.saveProcessing({
        eventId: row.eventId,
        subscriberName: subscriber.name,
        status: dead ? DEAD : FAILED,
        attempts,
        lastError: messageOf(error),
        updatedAt: this._clock.now()
      });
      return dead ? 'dead' : 'failed';
    }
    this._repository.saveProcessing({
      eventId: row.eventId,
      subscriberName: subscriber.name,
      status: DONE,
      attempts,
      lastError: null,
      updatedAt: this._clock.now()
    });
    return 'done';
  }

  _nextProcessing(subscriber, {retry}) {
    if (subscriber.ordered) {
      const row = this._repository.findFirstProcessing({
        subscriberName: subscriber.name,
        statuses: [PENDING, FAILED]
      });
      if (!row || (row.status === FAILED && !retry)) {
        return null;
      }
      return row;
    }
    const pending = this._repository.findFirstProcessing({
      subscriberName: subscriber.name,
      statuses: [PENDING]
    });
    if (pending) {
      return pending;
    }
    if (!retry) {
      return null;
    }
    return this._repository.findFirstProcessing({
      subscriberName: subscriber.name,
      statuses: [FAILED]
    });
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
