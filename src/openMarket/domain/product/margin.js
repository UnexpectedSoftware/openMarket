/**
 * Margin on the stored VAT-included cents, half-up to an integer percent.
 * `(priceCents - baseCents) / priceCents`. A price of 0, or a non-integer
 * or non-finite input, is null so a bad stored price does not throw.
 * Half-up is `Math.round`, the same rounding as an order-range average.
 * @param {{priceCents?: number, baseCents?: number}} [amounts]
 * @returns {number | null}
 */
export function marginPercent({priceCents, baseCents} = {}) {
  if (!wholeCents(priceCents) || !wholeCents(baseCents) || priceCents === 0) {
    return null;
  }
  return Math.round((priceCents - baseCents) * 100 / priceCents);
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function wholeCents(value) {
  return typeof value === 'number' && Number.isInteger(value);
}
