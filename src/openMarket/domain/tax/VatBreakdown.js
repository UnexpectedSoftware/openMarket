import Money from '../money/Money';
import VatRate from './VatRate';

/**
 * VAT base and quota for one rate, computed once from VAT-included line totals.
 * @typedef {object} VatBreakdownRow
 * @property {VatRate} rate
 * @property {Money} base
 * @property {Money} quota
 * @property {Money} gross
 */

/**
 * Per-rate VAT breakdown. The base is rounded half-up once per rate, not per line,
 * so the bases and quotas add up to the invoice total.
 */
export default class VatBreakdown {

  /**
   * @param {Array<{amount: Money | number | string, vatRate?: VatRate | object}>} lines
   * @returns {VatBreakdownRow[]}
   */
  static fromLines(lines) {
    const groups = new Map();
    (lines || []).forEach(line => {
      const rate = line && line.vatRate != null ? VatRate.from(line.vatRate) : VatRate.standard();
      const amount = Money.from(line && line.amount != null ? line.amount : 0);
      const current = groups.get(rate.key()) || {rate, gross: Money.ofCents(0)};
      current.gross = current.gross.plus(amount);
      groups.set(rate.key(), current);
    });
    return Array.from(groups.values()).map(group => {
      const base = baseOf(group.gross, group.rate);
      return {
        rate: group.rate,
        base,
        quota: Money.ofCents(group.gross.cents - base.cents),
        gross: group.gross
      };
    });
  }

}

/**
 * @param {Money} gross
 * @param {VatRate} rate
 * @returns {Money}
 */
function baseOf(gross, rate) {
  if (rate.kind !== 'S1' || rate.percent === 0) {
    return gross;
  }
  const denominator = 100 + rate.percent;
  const product = gross.cents * 100;
  const quotient = Math.floor(product / denominator);
  const remainder = product % denominator;
  const cents = remainder * 2 >= denominator ? quotient + 1 : quotient;
  return Money.ofCents(cents);
}
