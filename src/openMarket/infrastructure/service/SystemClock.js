import Clock from '../../domain/Clock';

/**
 * Wall clock. Returns the current time as an ISO-8601 UTC string.
 */
export default class SystemClock extends Clock {

  /**
   * @returns {string}
   */
  now() {
    return new Date().toISOString();
  }

}
