import Quantity from '../money/Quantity';

/**
 * Sales for one period: ticket totals, units sold, and each day's payment split.
 * Units add pieces and weighed kilograms together. A missing payment method counts
 * as cash, and a mixed ticket counts as its parts, so the three methods add up
 * to the period total.
 */
export default class OrderTakings {

  /**
   * @param {{totalCents: number, ticketCount: number, units: number, days: Array<{soldOn: string, cashCents: number, cardCents: number, bizumCents: number}>}} props
   */
  constructor({totalCents, ticketCount, units, days}) {
    this.totalCents = totalCents;
    this.ticketCount = ticketCount;
    this.units = units;
    this.averageCents = averageCents(totalCents, ticketCount);
    this.days = Object.freeze((days || []).map(day => Object.freeze({
      soldOn: day.soldOn,
      cashCents: day.cashCents,
      cardCents: day.cardCents,
      bizumCents: day.bizumCents
    })));
    Object.freeze(this);
  }

  /**
   * @param {{orders?: TakingsOrder[], lines?: TakingsLine[]}} [source]
   * @returns {OrderTakings}
   */
  static fromRows({orders, lines} = {}) {
    const tickets = orders || [];
    return new OrderTakings({
      totalCents: tickets.reduce((sum, order) => sum + centsOf(order.totalCents), 0),
      ticketCount: tickets.length,
      units: unitsOf(lines || []),
      days: daysOf(tickets)
    });
  }

}

/**
 * @typedef {object} TakingsOrder
 * @property {string} soldOn
 * @property {number} totalCents
 * @property {string | null} [method]
 * @property {Array<{method?: string, amountCents?: number}> | null} [parts]
 */

/**
 * @typedef {object} TakingsLine
 * @property {number | string | null} [quantityMilli]
 * @property {number | string | null} [quantity]
 */

/**
 * @param {number} totalCents
 * @param {number} ticketCount
 * @returns {number}
 */
function averageCents(totalCents, ticketCount) {
  if (!ticketCount) {
    return 0;
  }
  return Math.round(totalCents / ticketCount);
}

/**
 * @param {TakingsOrder[]} orders
 * @returns {Array<{soldOn: string, cashCents: number, cardCents: number, bizumCents: number}>}
 */
function daysOf(orders) {
  const byDay = new Map();
  orders.forEach(order => {
    const share = paymentShare(order);
    const current = byDay.get(order.soldOn) || emptyShare(order.soldOn);
    current.cashCents += share.cashCents;
    current.cardCents += share.cardCents;
    current.bizumCents += share.bizumCents;
    byDay.set(order.soldOn, current);
  });
  return Array.from(byDay.values()).sort((left, right) => {
    if (left.soldOn < right.soldOn) {
      return -1;
    }
    if (left.soldOn > right.soldOn) {
      return 1;
    }
    return 0;
  });
}

/**
 * @param {TakingsOrder} order
 * @returns {{cashCents: number, cardCents: number, bizumCents: number}}
 */
function paymentShare(order) {
  const parts = order.parts;
  if (order.method === 'mixed' && Array.isArray(parts) && parts.length > 0) {
    return parts.reduce(
      (share, part) => addCents(share, part.method, centsOf(part.amountCents)),
      emptyShare()
    );
  }
  const method = order.method === 'card' || order.method === 'bizum' ? order.method : 'cash';
  return addCents(emptyShare(), method, centsOf(order.totalCents));
}

/**
 * @param {string} [soldOn]
 * @returns {{soldOn: string, cashCents: number, cardCents: number, bizumCents: number}}
 */
function emptyShare(soldOn) {
  return {soldOn: soldOn || '', cashCents: 0, cardCents: 0, bizumCents: 0};
}

/**
 * @param {{cashCents: number, cardCents: number, bizumCents: number}} share
 * @param {string | null | undefined} method
 * @param {number} cents
 * @returns {{cashCents: number, cardCents: number, bizumCents: number}}
 */
function addCents(share, method, cents) {
  if (method === 'card') {
    share.cardCents += cents;
  } else if (method === 'bizum') {
    share.bizumCents += cents;
  } else {
    share.cashCents += cents;
  }
  return share;
}

/**
 * @param {TakingsLine[]} lines
 * @returns {number}
 */
function unitsOf(lines) {
  return lines.reduce((sum, line) => sum.plus(lineQuantity(line)), Quantity.ofMilli(0)).units;
}

/**
 * @param {TakingsLine} line
 * @returns {Quantity}
 */
function lineQuantity(line) {
  if (line.quantityMilli != null && line.quantityMilli !== '') {
    const milli = Number(line.quantityMilli);
    if (Number.isInteger(milli)) {
      return Quantity.ofMilli(milli);
    }
  }
  if (line.quantity == null || line.quantity === '') {
    return Quantity.ofMilli(0);
  }
  return Quantity.fromDecimal(line.quantity);
}

/**
 * @param {number | string | null | undefined} value
 * @returns {number}
 */
function centsOf(value) {
  const cents = Number(value);
  return Number.isFinite(cents) ? cents : 0;
}
