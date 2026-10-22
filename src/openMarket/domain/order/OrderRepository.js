/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./Order').default} Order */
/** @typedef {import('./OrderView').default} OrderView */
/** @typedef {import('./OrderDetail').default} OrderDetail */
/** @typedef {import('./OrdersQuery').default} OrdersQuery */
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
   * A page of list rows when `query` is an {@link OrdersQuery}.
   * One detail when `query` is `{id}`, or null when that id is unknown.
   * `total` on a page counts the whole range, not the page.
   * Neither result is an Order. `{id}` is not a new query port.
   * @param {OrdersQuery | {id?: string}} query
   * @returns {Observable<{items: OrderView[], total: number} | OrderDetail | null>}
   */
  find(query) {
    throw new Error('OrderRepository#find must be implemented');
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
