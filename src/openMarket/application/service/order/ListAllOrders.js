/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/order/Order').default} Order */
/** @typedef {import('../../../domain/order/OrderView').default} OrderView */
/** @typedef {import('../../../domain/order/OrdersQuery').default} OrdersQuery */
/** @typedef {import('../../../domain/order/OrderRangeSummary').default} OrderRangeSummary */
/** @typedef {import('../../../domain/order/OrderRepository').default} OrderRepository */
/** @typedef {import('../../../domain/order/OrderRepository').OrderListItem} OrderListItem */

export default class ListAllOrders {

  /**
   * @param {{repository: OrderRepository}} deps
   */
  constructor({repository}){
    this._orderRepository = repository;
  }

  /**
   * @param {{limit: number, offset: number, startDate: string, endDate: string}} query
   * @returns {Observable<OrderListItem[]>}
   */
  findAllByDates({ limit, offset, startDate, endDate }) {
    return this._orderRepository.findAllByDates({ limit, offset, startDate, endDate});
  }

  /**
   * @param {{id: string}} query
   * @returns {Observable<Order>}
   */
  findById({ id }){
    return this._orderRepository.findById({id});
  }

  /**
   * @param {OrdersQuery} query
   * @returns {Observable<{items: OrderView[], total: number}>}
   */
  find(query) {
    return this._orderRepository.find(query);
  }

  /**
   * @param {{from: string, to: string}} query
   * @returns {Observable<OrderRangeSummary>}
   */
  summary({from, to}) {
    return this._orderRepository.summary({from, to});
  }

}
