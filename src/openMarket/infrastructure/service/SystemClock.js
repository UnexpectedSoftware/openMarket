/** @import Clock from '../../domain/Clock' */

/** Shop timezone when none is configured. Spain does not change the instant, only the calendar date. */
const DEFAULT_TIME_ZONE = 'Europe/Madrid';

/**
 * Wall clock. `now()` is an ISO-8601 UTC instant.
 * `localDate` is that instant's calendar date in the shop timezone, default Europe/Madrid.
 * @implements {Clock}
 */
export default class SystemClock {

  /**
   * @param {{timeZone?: string}} [options]
   */
  constructor({timeZone = DEFAULT_TIME_ZONE} = {}) {
    this._timeZone = timeZone;
  }

  /**
   * @returns {string}
   */
  now() {
    return new Date().toISOString();
  }

  /**
   * @param {{instant: string}} params
   * @returns {string}
   */
  localDate({instant}) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this._timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date(instant));
    const value = type => {
      const part = parts.find(item => item.type === type);
      return part ? part.value : '';
    };
    return `${value('year')}-${value('month')}-${value('day')}`;
  }

}
