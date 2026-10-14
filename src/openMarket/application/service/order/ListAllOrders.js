/** @import { Observable } from 'rxjs/Observable' */
/** @import Order from '../../../domain/order/Order' */
/** @import OrderRepository from '../../../domain/order/OrderRepository' */
/** @import { OrderListItem } from '../../../domain/order/OrderRepository' */

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



}
