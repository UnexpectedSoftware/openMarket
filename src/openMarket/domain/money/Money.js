import InvalidMoneyError from './InvalidMoneyError';
import scaledInteger from './scaledInteger';
/** @import Quantity from './Quantity' */

/**
 * An amount of euros stored as an integer number of cents.
 * Rounding happens once, in {@link Money#times}. Totals add those cents.
 */
export default class Money {

  /**
   * @param {number} cents Whole cents. Not a euro amount.
   * @returns {Money}
   */
  static ofCents(cents) {
    if (!Number.isInteger(cents)) {
      throw new InvalidMoneyError({
        message: 'Money must be an integer number of cents',
        value: cents
      });
    }
    return new Money(cents);
  }

  /**
   * @param {number | string} euros A euro amount, as a decimal number or its text.
   * @returns {Money}
   */
  static fromEuros(euros) {
    return Money.ofCents(scaledInteger(euros, 100));
  }

  /**
   * @param {*} value
   * @returns {Money}
   */
  static from(value) {
    if (value instanceof Money) {
      return value;
    }
    if (value != null && typeof value === 'object' && Number.isInteger(value.cents)) {
      return Money.ofCents(value.cents);
    }
    return Money.fromEuros(value);
  }

  /**
   * @param {number} cents
   */
  constructor(cents) {
    /** @private */
    this._cents = cents;
  }

  /** @returns {number} */
  get cents() {
    return this._cents;
  }

  /**
   * Euro amount for display. Not for further arithmetic.
   * @returns {number}
   */
  toEuros() {
    const sign = this._cents < 0 ? -1 : 1;
    const abs = Math.abs(this._cents);
    return sign * (Math.trunc(abs / 100) + (abs % 100) / 100);
  }

  /**
   * @param {Money} other
   * @returns {Money}
   */
  plus(other) {
    const value = other instanceof Money ? other : Money.from(other);
    return Money.ofCents(this._cents + value.cents);
  }

  /**
   * Line amount. Half-up on `priceCents * qtyMilli / 1000`, for a non-negative price and quantity.
   * @param {Quantity} quantity
   * @returns {Money}
   */
  times(quantity) {
    const milli = quantityMilli(quantity);
    if (this._cents < 0 || milli < 0) {
      throw new InvalidMoneyError({
        message: 'Line amounts are calculated for non-negative prices and quantities',
        value: this._cents
      });
    }
    const product = this._cents * milli;
    if (!Number.isSafeInteger(product)) {
      throw new InvalidMoneyError({
        message: 'Line amount is outside the range that can be stored exactly',
        value: product
      });
    }
    const quotient = Math.floor(product / 1000);
    const remainder = product % 1000;
    const cents = remainder * 2 >= 1000 ? quotient + 1 : quotient;
    return Money.ofCents(cents);
  }

  /**
   * @param {Money} other
   * @returns {boolean}
   */
  equals(other) {
    return other instanceof Money && other.cents === this._cents;
  }

}

/**
 * @param {Quantity | {milli: number}} quantity
 * @returns {number}
 */
function quantityMilli(quantity) {
  if (quantity == null || !Number.isInteger(quantity.milli)) {
    throw new InvalidMoneyError({message: 'Quantity is required to price a line'});
  }
  return quantity.milli;
}
