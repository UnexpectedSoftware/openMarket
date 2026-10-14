/** @import Clock from '../../domain/Clock' */

/**
 * Wall clock. Returns the current time as an ISO-8601 UTC string.
 * @implements {Clock}
 */
export default class SystemClock {

  /**
   * @returns {string}
   */
  now() {
    return new Date().toISOString();
  }

}
