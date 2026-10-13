/**
 * Source of the current instant. The bus stores whatever now() returns.
 */
export default class Clock {

  /**
   * @returns {string} ISO-8601 UTC timestamp
   */
  now() {
    throw new Error('Clock#now must be implemented');
  }

}
