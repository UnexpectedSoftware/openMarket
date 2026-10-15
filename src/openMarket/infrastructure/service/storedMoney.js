import Money from '../../domain/money/Money';
import Quantity from '../../domain/money/Quantity';

/** @param {Money | number | string | null | undefined} money @returns {number} */
export function eurosOf(money) {
  return Money.from(money == null ? 0 : money).toEuros();
}

/** @param {Money | number | string | null | undefined} money @returns {number} */
export function centsOf(money) {
  return Money.from(money == null ? 0 : money).cents;
}

/** @param {Quantity | number | string | null | undefined} quantity @returns {number} */
export function unitsOf(quantity) {
  return Quantity.from(quantity == null ? 0 : quantity).units;
}

/** @param {Quantity | number | string | null | undefined} quantity @returns {number} */
export function milliOf(quantity) {
  return Quantity.from(quantity == null ? 0 : quantity).milli;
}

/**
 * Prefers the integer column. Falls back to the euro column for a row written before the migration.
 * @param {number | string | null | undefined} cents
 * @param {number | string | null | undefined} euros
 * @returns {Money}
 */
export function moneyFromColumns(cents, euros) {
  if (cents != null && cents !== '') {
    return Money.ofCents(Number(cents));
  }
  if (euros == null || euros === '') {
    return Money.ofCents(0);
  }
  return Money.fromEuros(euros);
}

/**
 * @param {number | string | null | undefined} milli
 * @param {number | string | null | undefined} units
 * @returns {Quantity}
 */
export function quantityFromColumns(milli, units) {
  if (milli != null && milli !== '') {
    return Quantity.ofMilli(Number(milli));
  }
  if (units == null || units === '') {
    return Quantity.ofMilli(0);
  }
  return Quantity.fromDecimal(units);
}
