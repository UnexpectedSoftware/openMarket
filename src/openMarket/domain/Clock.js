/**
 * Source of the current instant. The bus stores whatever now() returns.
 * Adapters declare `@implements {Clock}`; they do not extend this class.
 * @interface
 */
export default class Clock {

  /**
   * @returns {string} ISO-8601 UTC timestamp
   */
  now() {
    throw new Error('Clock#now must be implemented');
  }

}
