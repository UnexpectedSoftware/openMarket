import InvalidInvoiceNumberError from './InvalidInvoiceNumberError';

/** Width of the numeric part in `A/000123`. Wider numbers are not truncated. */
const NUMBER_WIDTH = 6;

const SERIES = /^[A-Za-z0-9][A-Za-z0-9-]{0,15}$/;

/**
 * Series plus a sequential number, formatted `A/000123` or `2026/000123`.
 */
export default class InvoiceNumber {

  /**
   * @param {object} params
   * @param {string} params.series
   * @param {number} params.number
   */
  constructor({series, number}) {
    const normalised = series == null ? '' : String(series).trim();
    const value = Number(number);
    if (!InvoiceNumber.isSeries(normalised) || !Number.isInteger(value) || value < 1) {
      throw new InvalidInvoiceNumberError({series, number});
    }
    this._series = normalised;
    this._number = value;
  }

  /**
   * A series is a short token without a slash, so the formatted number has one separator.
   * @param {string} series
   * @returns {boolean}
   */
  static isSeries(series) {
    return SERIES.test(series == null ? '' : String(series).trim());
  }

  /** @returns {string} */
  get series() {
    return this._series;
  }

  /** @returns {number} */
  get number() {
    return this._number;
  }

  /** @returns {string} */
  get formatted() {
    return this._series + '/' + String(this._number).padStart(NUMBER_WIDTH, '0');
  }

}
