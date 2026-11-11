/**
 * @typedef {object} DurableSubscriber
 * @property {string} name
 * @property {*} EventType the event class; its static `type` names stored rows
 * @property {(event: any) => void} handler
 * @property {boolean} ordered
 * @property {number} maxAttempts
 * @property {string} registeredAt
 */

/**
 * @typedef {object} SyncSubscriber
 * @property {Function} EventType
 * @property {(event: any) => void} handler
 */

/**
 * Who listens on the domain event bus: durable handlers by name, sync handlers,
 * and live listeners. The container wires it into the bus, like the Clock, so a
 * bootstrap can decide which of them actually run.
 */
export default class DomainEventSubscribers {

  constructor() {
    /** @type {Map<string, DurableSubscriber>} */
    this._durable = new Map();
    /** @type {SyncSubscriber[]} */
    this._sync = [];
    /** @type {Array<(event: any) => void>} */
    this._live = [];
  }

  /**
   * A later subscriber with the same name replaces this one.
   * @param {DurableSubscriber} subscriber
   * @returns {() => void} removes this subscriber, and not one that replaced it
   */
  addDurable(subscriber) {
    this._durable.set(subscriber.name, subscriber);
    return () => {
      if (this._durable.get(subscriber.name) === subscriber) {
        this._durable.delete(subscriber.name);
      }
    };
  }

  /** @returns {DurableSubscriber[]} */
  durable() {
    return [...this._durable.values()];
  }

  /**
   * @param {string} name
   * @returns {DurableSubscriber | null}
   */
  durableNamed(name) {
    return this._durable.get(name) || null;
  }

  /**
   * @param {SyncSubscriber} subscriber
   * @returns {() => void}
   */
  addSync(subscriber) {
    return addTo(this._sync, subscriber);
  }

  /** @returns {SyncSubscriber[]} */
  sync() {
    return this._sync.slice();
  }

  /**
   * @param {(event: any) => void} listener
   * @returns {() => void}
   */
  addLive(listener) {
    return addTo(this._live, listener);
  }

  /** @returns {Array<(event: any) => void>} */
  live() {
    return this._live.slice();
  }

}

/**
 * @template T
 * @param {T[]} list
 * @param {T} item
 * @returns {() => void}
 */
function addTo(list, item) {
  list.push(item);
  return () => {
    const index = list.indexOf(item);
    if (index >= 0) {
      list.splice(index, 1);
    }
  };
}
