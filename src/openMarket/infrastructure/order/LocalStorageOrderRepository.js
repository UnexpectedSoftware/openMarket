import OrderRepository from "../../domain/order/OrderRepository";
import RxLocalStorage from "../service/RxLocalStorage";
import {ORDERS_KEY} from '../service/LocalStorageKeys';
import {add} from '../service/floatCalculatorService'
import * as Rx from "rxjs";
import moment from "moment";

export default class LocalStorageOrderRepository extends OrderRepository {

  constructor({orderFactory}){
    super();
    this._localStorageKey = ORDERS_KEY;
    this._orderFactory = orderFactory;
  }

  /**
   *
   * @param id
   * @returns {Observable<Order>}
   */
  findById({id}) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(e => Rx.Observable.of([]))
      .flatMap(ordersArray => Rx.Observable.from(ordersArray))
      .filter(order => order._id === id)
      .map(order  => this._orderFactory.createWith({
        id: order._id,
        lines: order._lines,
        date: order._createdAt
      }));
  }

  findAllByDates({limit, offset, startDate, endDate}) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(e => Rx.Observable.of([]))
      .flatMap(ordersArray => Rx.Observable.from(ordersArray))
      .filter(order => moment(order._createdAt,"DD/MM/YYYY HH:mm:ss").isBetween(startDate, endDate, null, '[]'))
      .map(order => ({id:order._id,createdAt:order._createdAt,total:order._total }))
      .toArray()
      .map(ordersArray => ordersArray.sort((a, b) => {
        if(moment(a.createdAt,"DD/MM/YYYY HH:mm:ss").isBefore(moment(b.createdAt,"DD/MM/YYYY HH:mm:ss"))){
          return -1;
        }else if (moment(a.createdAt,"DD/MM/YYYY HH:mm:ss").isAfter(moment(b.createdAt,"DD/MM/YYYY HH:mm:ss"))){
          return 1;
        }
        return 0;
      }))
      .map(ordersArray => ordersArray.slice(offset, offset + limit))

  }

  /**
   *
   * @param startDate
   * @param endDate
   * @returns  {Observable<number>}
   */
  countByDates({ startDate, endDate }){
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(e => Rx.Observable.of([]))
      .flatMap(ordersArray => Rx.Observable.from(ordersArray))
      .filter(order => moment(order._createdAt,"DD/MM/YYYY HH:mm:ss").isBetween(startDate, endDate, null, '[]'))
      .count();
  }

  calculateTotalAmount({startDate, endDate}){
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(e => Rx.Observable.of([]))
      .flatMap(ordersArray => Rx.Observable.from(ordersArray))
      .filter(order => moment(order._createdAt,"DD/MM/YYYY HH:mm:ss").isBetween(startDate, endDate, null, '[]'))
      .reduce((acc, order) => add(acc,order._total),0);
  }

  /**
   *
   * @param {date} startDate
   * @param {date} endDate
   */
  calculateTotalAmountByDays({startDate, endDate}){
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(e => Rx.Observable.of([]))
      .flatMap(ordersArray => Rx.Observable.from(ordersArray))
      .filter(order => moment(order._createdAt,"DD/MM/YYYY HH:mm:ss").isBetween(startDate, endDate, null, '[]'))
      .groupBy(order => moment(order._createdAt,"DD/MM/YYYY HH:mm:ss").format('DD/MM/YYYY'))
      .flatMap(orderGroup =>
        orderGroup.reduce((acc, order) => add(acc,order._total),0)
          .map(total => ({total:total,createdAt:orderGroup.key}))
      )
      .toArray();
  }


  update({id, lines}) {
    return null;
  }

  save({order}) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(e => Rx.Observable.of([]))
      .map(ordersArray => {
        ordersArray.push(order);
        return ordersArray;
      })
      .flatMap(ordersArray => RxLocalStorage.saveLocalStorage({ localStorageKey: this._localStorageKey, value: ordersArray }))
      .map(() => order);
  }
}
