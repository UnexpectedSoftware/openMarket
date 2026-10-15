import InvalidMoneyError from './InvalidMoneyError';
import scaledInteger from './scaledInteger';

/**
 * A quantity stored as an integer number of milli-units.
 * One whole unit is 1000. A weighed kilogram uses milli-units as grams.
 */
export default class Quantity {

  /**
   * @param {number} milli
   * @returns {Quantity}
   */
  static ofMilli(milli) {
    if (!Number.isInteger(milli)) {
      throw new InvalidMoneyError({
        message: 'Quantity must be an integer number of milli-units',
        value: milli
      });
    }
    return new Quantity(milli);
  }

  /**
   * @param {number | string} units Decimal units, such as 0.35 kg or 3 pieces.
   * @returns {Quantity}
   */
  static fromDecimal(units) {
    return Quantity.ofMilli(scaledInteger(units, 1000));
  }

  /**
   * @param {*} value
   * @returns {Quantity}
   */
  static from(value) {
    if (value instanceof Quantity) {
      return value;
    }
    if (value != null && typeof value === 'object' && Number.isInteger(value.milli)) {
      return Quantity.ofMilli(value.milli);
    }
    return Quantity.fromDecimal(value);
  }

  /**
   * @param {number} milli
   */
  constructor(milli) {
    /** @private */
    this._milli = milli;
  }

  /** @returns {number} */
  get milli() {
    return this._milli;
  }

  /**
   * Decimal units for display and for stock, which stays in units.
   * @returns {number}
   */
  get units() {
    const sign = this._milli < 0 ? -1 : 1;
    const abs = Math.abs(this._milli);
    return sign * (Math.trunc(abs / 1000) + (abs % 1000) / 1000);
  }

  /**
   * @param {Quantity | number | string} other
   * @returns {Quantity}
   */
  plus(other) {
    const value = other instanceof Quantity ? other : Quantity.from(other);
    return Quantity.ofMilli(this._milli + value.milli);
  }

  /**
   * @param {Quantity} other
   * @returns {boolean}
   */
  equals(other) {
    return other instanceof Quantity && other.milli === this._milli;
  }

}
