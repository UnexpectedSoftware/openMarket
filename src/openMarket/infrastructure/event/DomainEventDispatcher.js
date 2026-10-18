import {record} from '../logging/ErrorLog';
/** @typedef {import('../../domain/service/DomainEventBus').default} DomainEventBus */
/** @typedef {import('../../domain/service/Transaction').default} Transaction */

const DEFAULT_INTERVAL_MS = 1000;

/**
 * Claims stored events and runs durable handlers after the caller's transaction
 * has committed. CreateOrder calls dispatch() as soon as the sale commits.
 * The timer only retries failed handlers and recovers work left by a crash.
 * The bus never sees this transaction.
 */
export default class DomainEventDispatcher {

  /**
   * @param {object} deps
   * @param {DomainEventBus} deps.domainEventBus
   * @param {Transaction} deps.transaction
   * @param {number} [deps.intervalMs]
   */
  constructor({domainEventBus, transaction, intervalMs = DEFAULT_INTERVAL_MS}) {
    if (!domainEventBus || !transaction) {
      throw new Error('DomainEventDispatcher requires a domain event bus and a transaction');
    }
    this._bus = domainEventBus;
    this._transaction = transaction;
    this._intervalMs = intervalMs;
    this._timer = null;
    this._busy = false;
  }

  /**
   * Recovers anything left undispatched or PROCESSING, then retries on the interval.
   * The timer does not keep the process alive and is not the sale path.
   */
  start() {
    if (this._timer) {
      return;
    }
    const tick = () => {
      try {
        this.dispatch();
        this._bus.processPending();
      } catch (error) {
        record(error);
      }
    };
    this._timer = setInterval(tick, this._intervalMs);
    if (typeof this._timer.unref === 'function') {
      this._timer.unref();
    }
    tick();
  }

  stop() {
    if (!this._timer) {
      return;
    }
    clearInterval(this._timer);
    this._timer = null;
  }

  /**
   * Claims undispatched events, recovers crashed rows, and runs handlers that are free.
   * A FAILED row waits for processPending.
   */
  dispatch() {
    if (this._busy || this._transaction.inTransaction()) {
      return;
    }
    this._busy = true;
    try {
      this._transaction.execute(() => this._bus.fanOut());
      this._bus.recover();
      this._bus.deliverReady();
    } finally {
      this._busy = false;
    }
  }

}
