import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/filter';
import {aggregateId, hydrate, typeName} from '../event/registry';
import {DEAD, DONE, FAILED, PENDING, PROCESSING} from './domainEventStatus';

const DEFAULT_MAX_ATTEMPTS = 5;
const ERROR_LIMIT = 500;

/**
 * Stores facts and tells in-memory listeners about facts that have already committed.
 * Durable handlers are claimed later by DomainEventDispatcher. This bus does not
 * open, join, or observe a transaction.
 */
export default class DomainEventBus {

  /**
   * @param {DomainEventRepository} repository
   * @param {Identity} identity
   * @param {Clock} clock
   * @param {number} [maxAttempts]
   */
  constructor({
    repository,
    identity,
    clock,
    maxAttempts = DEFAULT_MAX_ATTEMPTS
  } = {}) {
    if (!repository || !identity || !clock) {
      throw new Error('DomainEventBus requires a repository, an identity, and a clock');
    }
    this._events = new Subject();
    this._repository = repository;
    this._identity = identity;
    this._clock = clock;
    this._maxAttempts = maxAttempts;
    this._sync = new Map();
    this._durable = new Map();
    this._queued = [];
    this._draining = false;
    this._pumpAgain = false;
  }

  /**
   * Inserts the event on the caller's connection and holds it until raise.
   * An open transaction takes the row with it. Nobody is notified yet.
   * @param {*} event
   */
  save(event) {
    this._assertEvent(event);
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
   * Notifies synchronous handlers and ofType listeners for every event saved since
   * the last raise. The facts have already committed, so a synchronous throw stays
   * on that handler and does not stop the others.
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
    this._sync.forEach(subscriber => {
      if (!(event instanceof subscriber.EventType)) {
        return;
      }
      try {
        subscriber.handler(event);
      } catch (error) {
        // The sale is already committed. This handler cannot undo it.
      }
    });
    this._events.next(event);
  }

  /**
   * @returns {Observable}
   */
  events() {
    return this._events.asObservable();
  }

  /**
   * Live listener. Nothing is replayed. Call raise after the commit.
   * @param {Function} EventType
   * @returns {Observable}
   */
  ofType(EventType) {
    return this.events().filter(event => event instanceof EventType);
  }

  /**
   * Runs from raise, after the fact has committed.
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
   * Recorded per event and retried until success or dead-letter.
   * Delivery is at least once, in insertion order when ordered is true.
   * The first registration time is kept and reused. Events stored before it are skipped.
   * @param {string} name
   * @param {Function} EventType
   * @param {function(*): void} handler
   * @param {{ordered?: boolean, maxAttempts?: number}} [options]
   * @returns {function(): void}
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

function messageOf(error) {
  const text = error instanceof Error ? error.message : String(error);
  return text.slice(0, ERROR_LIMIT);
}
