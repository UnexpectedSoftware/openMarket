import OrderRepository from "../../domain/order/OrderRepository";
import RxLocalStorage from "../service/RxLocalStorage";
import {ORDERS_KEY} from '../service/LocalStorageKeys';
import * as Rx from "rxjs";
import moment from "moment";

export default class LocalStorageOrderRepository extends OrderRepository {

  constructor({orderFactory}){
    super();
    this._localStorageKey = ORDERS_KEY;
    this._orderFactory = orderFactory;
  }

  findById({id}) {
    return null;
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
      .reduce((acc, order) => acc + order._total,0);
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
