import SystemClock from '../service/SystemClock';
/** @typedef {import('../../domain/Clock').default} Clock */

/**
 * The development clock. It reads the system time until a caller moves it to an
 * instant, so the demo seed can sell each historical ticket at its own time.
 * Zones and formats come from {@link SystemClock}.
 * @implements {Clock}
 */
export default class SettableClock {

  /**
   * @param {{clock?: SystemClock}} [deps]
   */
  constructor({clock = new SystemClock()} = {}) {
    this._clock = clock;
    /** @type {string | null} */
    this._instant = null;
  }

  /**
   * @param {Date | string} instant
   * @returns {SettableClock}
   */
  moveTo(instant) {
    this._instant = new Date(instant).toISOString();
    return this;
  }

  /**
   * Back to the system time.
   * @returns {SettableClock}
   */
  resume() {
    this._instant = null;
    return this;
  }

  /** @returns {string} */
  now() {
    return this._instant === null ? this._clock.now() : this._instant;
  }

  /**
   * @param {{instant: string}} query
   * @returns {string}
   */
  localDate({instant}) {
    return this._clock.localDate({instant});
  }

  /** @returns {{instant: string, local: string, date: string}} */
  zonedNow() {
    return this._clock.zoned({instant: this.now()});
  }

  /**
   * @param {{instant: string}} query
   * @returns {{instant: string, local: string, date: string}}
   */
  zoned({instant}) {
    return this._clock.zoned({instant});
  }

}
