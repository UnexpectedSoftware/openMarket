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

  /**
   * Calendar date of an instant in the shop's timezone.
   * @param {{instant: string}} params ISO-8601 timestamp, usually `now()`
   * @returns {string} `YYYY-MM-DD`
   */
  localDate({instant}) {
    throw new Error('Clock#localDate must be implemented');
  }

}
