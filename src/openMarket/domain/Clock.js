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

  /**
   * The current instant in the shop's timezone.
   * @returns {{instant: string, local: string, date: string}}
   */
  zonedNow() {
    throw new Error('Clock#zonedNow must be implemented');
  }

  /**
   * An instant as UTC, as an offset timestamp, and as a calendar date.
   * @param {{instant: string}} params
   * @returns {{instant: string, local: string, date: string}}
   */
  zoned({instant}) {
    throw new Error('Clock#zoned must be implemented');
  }

}
