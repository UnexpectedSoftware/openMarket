/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */

/**
 * One row on the orders list. A read model, not an Order.
 * `createdAt` is the shop-local clock as ISO-8601 without a zone (`2026-10-21T14:02:03`),
 * the same numbers stored on the order.
 * @typedef {object} OrderListItem
 * @property {string} orderId
 * @property {string} invoiceNumber
 * @property {string} createdAt
 * @property {number} itemCount
 * @property {'cash'|'card'|null} paymentMethod
 * @property {number} totalCents
 * @property {boolean} cancelled
 */

/**
 * Totals for the selected period. `averageCents` is `Math.round(totalCents / ticketCount)`,
 * or 0 when there are no tickets. The sum is a Money value before that division.
 * @typedef {object} OrderSummary
 * @property {number} totalCents
 * @property {number} ticketCount
 * @property {number} averageCents
 */

/**
 * Port: orders for the list screen, as plain read models.
 * @interface
 */
export default class OrdersQuery {

  /**
   * Orders in the range, newest first. `total` counts the whole range, not the page.
   * Completes with plain objects. It does not load Order aggregates.
   * @param {{from: string, to: string, limit?: number, offset?: number}} query
   * @returns {Observable<{items: OrderListItem[], total: number}>}
   */
  list({from, to, limit, offset}) {
    throw new Error('OrdersQuery#list must be implemented');
  }

  /**
   * Sales, ticket count, and average ticket for the same range.
   * @param {{from: string, to: string}} query
   * @returns {Observable<OrderSummary>}
   */
  daySummary({from, to}) {
    throw new Error('OrdersQuery#daySummary must be implemented');
  }

}
