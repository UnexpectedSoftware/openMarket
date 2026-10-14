/** @import { Observable } from 'rxjs/Observable' */
/** @import OrderRepository from '../../../domain/order/OrderRepository' */
/** @import { DailyTotal } from '../../../domain/order/OrderRepository' */

export default class OrdersStatistics {
  /**
   * @param {{repository: OrderRepository}} deps
   */
  constructor ({repository}) {
    this._productRepository = repository;
  }

  /**
   * @param {{startDate: string, endDate: string}} query
   * @returns {Observable<number>}
   */
  countByDates({ startDate, endDate }){
    return this._productRepository.countByDates({startDate, endDate});
  }

  /**
   * @param {{startDate: string, endDate: string}} query
   * @returns {Observable<number>}
   */
  calculateTotalAmount ({startDate, endDate}){
    return this._productRepository.calculateTotalAmount({startDate, endDate});
  }

  /**
   * @param {{startDate: string, endDate: string}} query
   * @returns {Observable<DailyTotal[]>}
   */
  calculateTotalAmountByDays({startDate, endDate}) {
    return this._productRepository.calculateTotalAmountByDays({startDate, endDate});
  }

}
