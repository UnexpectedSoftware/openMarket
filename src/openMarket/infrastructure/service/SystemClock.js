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
    const parts = this._parts(instant, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  /** @returns {{instant: string, local: string, date: string}} */
  zonedNow() {
    return this.zoned({instant: this.now()});
  }

  /**
   * @param {{instant: string}} params
   * @returns {{instant: string, local: string, date: string}}
   */
  zoned({instant}) {
    const date = this.localDate({instant});
    const parts = this._parts(instant, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'longOffset'
    });
    const offset = String(parts.timeZoneName || 'GMT+00:00').replace('GMT', '');
    return {
      instant: new Date(instant).toISOString(),
      local: `${date}T${parts.hour}:${parts.minute}:${parts.second}${offset}`,
      date
    };
  }

  /**
   * @param {string} instant
   * @param {object} options
   * @returns {Record<string, string>}
   */
  _parts(instant, options) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this._timeZone,
      ...options
    }).formatToParts(new Date(instant));
    const values = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    });
    return values;
  }

}
