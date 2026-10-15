import Money from '../../domain/money/Money';
import Quantity from '../../domain/money/Quantity';

const euros = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
});

/**
 * Formats euros for Spain. Accepts a Money value or a euro amount.
 * @param {Money | number | string | null | undefined} amount
 * @returns {string}
 */
export function formatMoney(amount) {
  const value = euroNumber(amount);
  if (!Number.isFinite(value)) {
    return '';
  }
  return euros.format(value);
}

/**
 * Line total in euros, rounded half-up once.
 * @param {Money | number | string} price
 * @param {Quantity | number | string} quantity
 * @returns {number}
 */
export function lineEuros(price, quantity) {
  const money = Money.from(price == null ? 0 : price);
  const units = Quantity.from(quantity == null ? 0 : quantity);
  const safe = units.milli < 0 ? Quantity.ofMilli(0) : units;
  return money.times(safe).toEuros();
}

/**
 * @param {Array<Money | number | string>} amounts Euro amounts or Money values.
 * @returns {number}
 */
export function sumEuros(amounts) {
  return (amounts || []).reduce(
    (sum, amount) => sum.plus(Money.from(amount == null ? 0 : amount)),
    Money.ofCents(0)
  ).toEuros();
}

/**
 * @param {Money | number | string | null | undefined} amount
 * @returns {number}
 */
function euroNumber(amount) {
  if (amount instanceof Money) {
    return amount.toEuros();
  }
  if (amount != null && typeof amount === 'object' && typeof amount.toEuros === 'function') {
    return amount.toEuros();
  }
  return Number(amount);
}
