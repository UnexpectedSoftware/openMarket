import DomainEventSubscribers from '../../domain/service/DomainEventSubscribers';
/** @typedef {import('../../domain/service/DomainEventSubscribers').DurableSubscriber} DurableSubscriber */
/** @typedef {import('../../domain/service/DomainEventSubscribers').SyncSubscriber} SyncSubscriber */

/**
 * The development subscriber set. It is the normal set until the demo seed
 * bootstraps it with the subscribers it keeps: those durable handlers run for real,
 * every other durable handler is replaced by one that does nothing under the same
 * name, and sync and live listeners are left out. Events still go through the
 * outbox and are recorded as handled, so a plugin never receives them later.
 * Like {@link SettableClock}, `resume` returns to the normal set.
 */
export default class SeedableDomainEventSubscribers {

  /**
   * @param {{subscribers?: DomainEventSubscribers}} [deps]
   */
  constructor({subscribers = new DomainEventSubscribers()} = {}) {
    this._subscribers = subscribers;
    /** @type {Set<string> | null} */
    this._kept = null;
  }

  /**
   * @param {{keep: string[]}} seed durable subscriber names whose handlers run for real
   * @returns {SeedableDomainEventSubscribers}
   */
  seedWith({keep}) {
    this._kept = new Set(keep);
    return this;
  }

  /** @returns {SeedableDomainEventSubscribers} */
  resume() {
    this._kept = null;
    return this;
  }

  /**
   * @param {DurableSubscriber} subscriber
   * @returns {() => void}
   */
  addDurable(subscriber) {
    return this._subscribers.addDurable(subscriber);
  }

  /** @returns {DurableSubscriber[]} */
  durable() {
    const kept = this._kept;
    const all = this._subscribers.durable();
    if (kept === null) {
      return all;
    }
    return all.map(subscriber => kept.has(subscriber.name) ? subscriber : {...subscriber, handler: ignore});
  }

  /**
   * @param {string} name
   * @returns {DurableSubscriber | null}
   */
  durableNamed(name) {
    return this._subscribers.durableNamed(name);
  }

  /**
   * @param {SyncSubscriber} subscriber
   * @returns {() => void}
   */
  addSync(subscriber) {
    return this._subscribers.addSync(subscriber);
  }

  /** @returns {SyncSubscriber[]} */
  sync() {
    return this._kept === null ? this._subscribers.sync() : [];
  }

  /**
   * @param {(event: any) => void} listener
   * @returns {() => void}
   */
  addLive(listener) {
    return this._subscribers.addLive(listener);
  }

  /** @returns {Array<(event: any) => void>} */
  live() {
    return this._kept === null ? this._subscribers.live() : [];
  }

}

/**
 * The stand-in for a handler with outside effects (plugin delivery, printing).
 */
function ignore() {}
