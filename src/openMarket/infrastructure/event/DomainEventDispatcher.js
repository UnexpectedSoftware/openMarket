const DEFAULT_INTERVAL_MS = 1000;

/**
 * Claims stored events and runs durable handlers after the caller's transaction
 * has committed. The bus never sees this transaction.
 */
export default class DomainEventDispatcher {

  /**
   * @param {DomainEventBus} domainEventBus
   * @param {Transaction} transaction
   * @param {number} [intervalMs]
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
   * Fans out once, then again on the interval. The timer does not keep the process alive.
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
        // A subscriber failure is stored on its row. The timer stays up.
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
