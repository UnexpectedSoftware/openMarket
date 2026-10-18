import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {aggregateId, hydrate, typeName} from '../event/registry';
import SyncSubscriberOutsideTransactionError from '../event/SyncSubscriberOutsideTransactionError';
import {DEAD, DONE, FAILED, PENDING, PROCESSING} from './domainEventStatus';
/** @typedef {import('../event/DomainEventRepository').default} DomainEventRepository */
/** @typedef {import('../Identity').default} Identity */
/** @typedef {import('../Clock').default} Clock */

const DEFAULT_MAX_ATTEMPTS = 5;
const ERROR_LIMIT = 500;

/**
 * Stores facts and tells in-memory listeners about facts that have already committed.
 * Durable handlers are claimed later by DomainEventDispatcher. This bus does not
 * open, join, or observe a transaction.
 */
export default class DomainEventBus {

  /**
   * @param {object} [deps]
   * @param {DomainEventRepository} [deps.repository]
   * @param {Identity} [deps.identity]
   * @param {Clock} [deps.clock]
   * @param {number} [deps.maxAttempts]
   * @param {(error: any) => void} [deps.recordError]
   * @param {() => boolean} [deps.inTransaction]
   */
  constructor({
    repository,
    identity,
    clock,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    recordError,
    inTransaction
  } = {}) {
    if (!repository || !identity || !clock) {
      throw new Error('DomainEventBus requires a repository, an identity, and a clock');
    }
    this._events = new Subject();
    this._repository = repository;
    this._identity = identity;
    this._clock = clock;
    this._maxAttempts = maxAttempts;
    this._recordError = typeof recordError === 'function' ? recordError : () => {};
    this._inTransaction = typeof inTransaction === 'function' ? inTransaction : null;
    this._durable = new Map();
    this._sync = [];
    this._live = [];
    this._queued = [];
    this._draining = false;
    this._pumpAgain = false;
  }

  /**
   * Runs sync subscribers, then inserts a durable event on the caller's connection
   * and holds it until raise. An event is durable when its type is marked durable,
   * or when a durable subscriber for that type is already registered. An open
   * transaction takes the row and the sync writes with it. Nobody is notified yet.
   * @param {*} event
   */
  save(event) {
    this._assertEvent(event);
    if (!this._isDurable(event)) {
      throw new Error(`Domain event ${typeName(event)} is not durable`);
    }
    this._runSync(event);
    this._repository.save({
      id: this._identity.generate(),
      type: typeName(event),
      payload: JSON.stringify(event),
      aggregateId: aggregateId(event),
      createdAt: this._clock.now()
    });
    this._queued.push(event);
  }

  /**
   * Holds the event until raise without inserting a row.
   * Use this for facts that only live listeners need.
   * @param {*} event
   */
  record(event) {
    this._assertEvent(event);
    this._queued.push(event);
  }

  /**
   * Notifies ofType listeners for every event queued since the last raise.
   * A listener that throws is logged and does not stop the others.
   */
  raise() {
    const events = this._queued.splice(0);
    events.forEach(event => this._notify(event));
  }

  /**
   * Drops events saved during a transaction that rolled back, so a later raise
   * cannot announce them.
   */
  discard() {
    this._queued.length = 0;
  }

  _notify(event) {
    this._live.slice().forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this._recordError(error);
      }
    });
    try {
      this._events.next(event);
    } catch (error) {
      this._recordError(error);
    }
  }

  /**
   * @returns {Observable}
   */
  events() {
    return this._events.asObservable();
  }

  /**
   * Live listener. Nothing is replayed. Call raise after the commit.
   * A throw in the handler is logged and does not unsubscribe it or the others.
   * @param {Function} EventType
   * @returns {Observable}
   */
  ofType(EventType) {
    const recordError = this._recordError;
    const observable = Observable.create(observer => {
      const listener = event => {
        if (!(event instanceof EventType)) {
          return;
        }
        observer.next(event);
      };
      this._live.push(listener);
      return () => {
        const index = this._live.indexOf(listener);
        if (index >= 0) {
          this._live.splice(index, 1);
        }
      };
    });
    const subscribe = observable.subscribe.bind(observable);
    observable.subscribe = function guardedSubscribe(observerOrNext, error, complete) {
      return subscribe(guardListener(observerOrNext, recordError), error, complete);
    };
    return observable;
  }

  /**
   * Runs during save, before the row is inserted, while the caller's transaction
   * is still open. A throw aborts save and rolls that transaction back.
   * record and raise do not call it. It is not retried and it is not stored.
   * @param {Function} EventType
   * @param {(event: any) => void} handler
   * @returns {() => void}
   */
  subscribeSync(EventType, handler) {
    if (typeof EventType !== 'function') {
      throw new Error('Domain event subscriber type is required');
    }
    if (typeof handler !== 'function') {
      throw new Error('Domain event subscriber handler is required');
    }
    const subscriber = {EventType, handler};
    this._sync.push(subscriber);
    return () => {
      const index = this._sync.indexOf(subscriber);
      if (index >= 0) {
        this._sync.splice(index, 1);
      }
    };
  }

  /**
   * Recorded per event and retried until success or dead-letter.
   * Delivery is at least once, in insertion order when ordered is true.
   * The first registration time is kept and reused. Events stored before it are skipped.
   * @param {string} name
   * @param {Function} EventType
   * @param {(event: any) => void} handler
   * @param {{ordered?: boolean, maxAttempts?: number}} [options]
   * @returns {() => void}
   */
  subscribeDurable(name, EventType, handler, {ordered = true, maxAttempts = this._maxAttempts} = {}) {
    this._assertSubscriber(name, EventType, handler);
    const existing = this._repository.findSubscriber({subscriberName: name});
    const registeredAt = existing ? existing.registeredAt : this._clock.now();
    if (!existing) {
      this._repository.saveSubscriber({subscriberName: name, registeredAt});
    }
    this._durable.set(name, {
      name,
      EventType,
      handler,
      ordered: ordered !== false,
      maxAttempts: maxAttempts > 0 ? maxAttempts : this._maxAttempts,
      registeredAt
    });
    return () => {
      const current = this._durable.get(name);
      if (current && current.handler === handler) {
        this._durable.delete(name);
      }
    };
  }

  /**
   * Claims every event that has not been fanned out yet.
   * One PENDING row per durable subscriber registered at or before the event.
   * Call this inside the dispatcher's transaction.
   */
  fanOut() {
    const updatedAt = this._clock.now();
    this._repository.findUndispatched().forEach(record => {
      this._durable.forEach(subscriber => {
        if (subscriber.EventType.type !== record.type) {
          return;
        }
        if (record.createdAt < subscriber.registeredAt) {
          return;
        }
        this._repository.insertProcessing({
          eventId: record.id,
          subscriberName: subscriber.name,
          status: PENDING,
          attempts: 0,
          lastError: null,
          updatedAt
        });
      });
      this._repository.markDispatched({id: record.id, dispatchedAt: updatedAt});
    });
  }

  /**
   * Rows left PROCESSING by a crash go back to PENDING, or to DEAD when the
   * attempt count is already used up.
   */
  recover() {
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

  /**
   * Runs PENDING rows that are free to run. A FAILED row waits for processPending.
   */
  deliverReady() {
    this._pump({retry: false});
  }

  /**
   * Runs one retry of a FAILED row, then the PENDING rows that are free to run.
   */
  processPending() {
    this._pump({retry: true});
  }

  _pump({retry}) {
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

  /**
   * Sync handlers share the open transaction. The first throw stops the rest
   * and prevents the insert.
   * @param {*} event
   */
  _runSync(event) {
    const handlers = this._sync.filter(subscriber => event instanceof subscriber.EventType);
    if (handlers.length === 0) {
      return;
    }
    if (!this._inTransaction || !this._inTransaction()) {
      throw new SyncSubscriberOutsideTransactionError({type: typeName(event)});
    }
    handlers.forEach(subscriber => subscriber.handler(event));
  }

  _isDurable(event) {
    if (event.constructor && event.constructor.durable === true) {
      return true;
    }
    const type = typeName(event);
    let durable = false;
    this._durable.forEach(subscriber => {
      if (subscriber.EventType.type === type) {
        durable = true;
      }
    });
    return durable;
  }

  _assertEvent(event) {
    if (event == null || typeof event !== 'object') {
      throw new Error('DomainEventBus expects an event');
    }
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

/**
 * RxJS 5 unsubscribes a listener that throws. Catch it here so the listener
 * stays, the other listeners still run, and raise() does not throw.
 * @param {*} observerOrNext
 * @param {(error: any) => void} recordError
 * @returns {*}
 */
function guardListener(observerOrNext, recordError) {
  if (typeof observerOrNext === 'function') {
    return function onEvent(event) {
      try {
        return observerOrNext(event);
      } catch (error) {
        recordError(error);
      }
    };
  }
  // Operator subscribers (map, filter) are Subscriber instances. Replacing them
  // would drop the rest of the chain. Function handlers are the listeners that throw.
  if (observerOrNext && typeof observerOrNext.unsubscribe === 'function' && 'destination' in observerOrNext) {
    return observerOrNext;
  }
  if (observerOrNext && typeof observerOrNext.next === 'function') {
    const next = observerOrNext.next.bind(observerOrNext);
    const guarded = {
      next(event) {
        try {
          return next(event);
        } catch (error) {
          recordError(error);
        }
      }
    };
    if (typeof observerOrNext.error === 'function') {
      guarded.error = observerOrNext.error.bind(observerOrNext);
    }
    if (typeof observerOrNext.complete === 'function') {
      guarded.complete = observerOrNext.complete.bind(observerOrNext);
    }
    return guarded;
  }
  return observerOrNext;
}

function messageOf(error) {
  const text = error instanceof Error ? error.message : String(error);
  return text.slice(0, ERROR_LIMIT);
}
