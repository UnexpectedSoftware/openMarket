import ErrorCode from '../error/ErrorCode';
import Money from '../money/Money';
import Quantity from '../money/Quantity';

/**
 * A cart or order line the cashier is still editing.
 * @typedef {object} LineCheck
 * @property {'PRODUCT' | 'FREE'} [kind]
 * @property {Quantity | number | string | null} [quantity]
 * @property {Money | number | string | null} [amount]
 * @property {Money | number | string | null} [price]
 * @property {Money | number | string | null} [unitPrice]
 * @property {boolean} [weighted] False means a whole-unit product. Omitted means unknown.
 */

/**
 * Whether a line can be sold. The cart uses this to flag a row.
 * Order.addLine uses it and raises when the line cannot be sold.
 * A missing `weighted` flag does not reject a fraction: older lines did not store one.
 * @param {LineCheck | null | undefined} line
 * @returns {{valid: boolean, code?: string}}
 */
/**
 * @param {*} value
 * @returns {'PRODUCT' | 'FREE'}
 */
export function lineKind(value) {
  if (value === 'FREE') {
    return 'FREE';
  }
  return 'PRODUCT';
}

export function validateLine(line) {
  if (line && line.kind === 'FREE') {
    const cents = centsOf(line.amount != null ? line.amount : (line.unitPrice != null ? line.unitPrice : line.price));
    if (cents == null || cents <= 0) {
      return {valid: false, code: ErrorCode.ORDER_LINE_INVALID};
    }
    return {valid: true};
  }
  const quantity = quantityOf(line && line.quantity);
  if (!quantity || quantity.milli <= 0) {
    return {valid: false, code: ErrorCode.ORDER_QUANTITY_INVALID};
  }
  if (line && line.weighted === false && quantity.milli % 1000 !== 0) {
    return {valid: false, code: ErrorCode.ORDER_LINE_INVALID};
  }
  return {valid: true};
}

/**
 * @param {*} value
 * @returns {number | null}
 */
function centsOf(value) {
  if (value == null || value === '') {
    return null;
  }
  try {
    return Money.from(value).cents;
  } catch (error) {
    return null;
  }
}

/**
 * @param {*} value
 * @returns {Quantity | null}
 */
function quantityOf(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number' && !isFinite(value)) {
    return null;
  }
  try {
    return Quantity.from(value);
  } catch (error) {
    return null;
  }
}
