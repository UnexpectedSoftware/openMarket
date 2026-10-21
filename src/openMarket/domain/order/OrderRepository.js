/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./Order').default} Order */
/** @typedef {import('./OrderView').default} OrderView */
/** @typedef {import('./OrderRangeSummary').default} OrderRangeSummary */

/**
 * One row of the order list.
 * @typedef {object} OrderListItem
 * @property {string} id
 * @property {string} createdAt
 * @property {number} total
 */

/**
 * Takings for one day.
 * @typedef {object} DailyTotal
 * @property {number} total
 * @property {string} createdAt
 */

/**
 * Port for the order collection. Orders are not updated after they are saved.
 * Adapters declare `@implements {OrderRepository}`; they do not extend this class.
 * @interface
 */
export default class OrderRepository {

  /**
   * Emits the order, or completes empty when the id is unknown.
   * @param {{id: string}} query
   * @returns {Observable<Order>}
   */
  findById({ id }) {
    throw new Error('OrderRepository#findById must be implemented');
  }

  /**
   * @param {{limit: number, offset: number, startDate: string, endDate: string}} query
   * @returns {Observable<OrderListItem[]>}
   */
  findAllByDates({ limit, offset, startDate, endDate }) {
    throw new Error('OrderRepository#findAllByDates must be implemented');
  }

  /**
   * Orders in the range, newest first, as read models. `total` counts the whole range.
   * @param {{from: string, to: string, limit?: number, offset?: number}} query
   * @returns {Observable<{items: OrderView[], total: number}>}
   */
  findByRange({from, to, limit, offset}) {
    throw new Error('OrderRepository#findByRange must be implemented');
  }

  /**
   * Sales, ticket count, and average ticket for the same range.
   * @param {{from: string, to: string}} query
   * @returns {Observable<OrderRangeSummary>}
   */
  summary({from, to}) {
    throw new Error('OrderRepository#summary must be implemented');
  }

  /**
   * @param {{startDate: string, endDate: string}} query
   * @returns {Observable<number>}
   */
  countByDates({ startDate, endDate }) {
    throw new Error('OrderRepository#countByDates must be implemented');
  }

  /**
   * @param {{startDate: string, endDate: string}} query
   * @returns {Observable<number>}
   */
  calculateTotalAmount({startDate, endDate}) {
    throw new Error('OrderRepository#calculateTotalAmount must be implemented');
  }

  /**
   * @param {{startDate: string, endDate: string}} query
   * @returns {Observable<DailyTotal[]>}
   */
  calculateTotalAmountByDays({startDate, endDate}) {
    throw new Error('OrderRepository#calculateTotalAmountByDays must be implemented');
  }

  /**
   * @param {{order: Order}} command
   * @returns {Observable<Order>}
   */
  save({ order }) {
    throw new Error('OrderRepository#save must be implemented');
  }

}
