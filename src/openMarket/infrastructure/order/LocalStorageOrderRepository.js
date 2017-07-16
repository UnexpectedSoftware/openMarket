import OrderRepository from "../../domain/order/OrderRepository";
import RxLocalStorage from "../service/RxLocalStorage";
import * as Rx from "rxjs";
import moment from "moment";

export default class LocalStorageOrderRepository extends OrderRepository {

  constructor({orderFactory}){
    super();
    this._localStorageKey = 'orders';
    this._orderFactory = orderFactory;
  }

  findById({id}) {
    return null;
  }

  findAllByDates({limit, offset, startDate, endDate}) {
    console.log("dates:",startDate,endDate);
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(e => Rx.Observable.of([]))
      .flatMap(ordersArray => Rx.Observable.from(ordersArray))
      .filter(order => moment(order._createdAt,"DD/MM/YYYY HH:mm:ss").isBetween(startDate, endDate, null, '[]'))
      .map(order => ({id:order._id,createdAt:order._createdAt,total:order._total }))
      .toArray()
      .map(ordersArray => ordersArray.slice(offset, limit))
  }

  update({id, lines}) {
    return null;
  }

  save({lines}) {
    return RxLocalStorage.loadLocalStorage({ localStorageKey: this._localStorageKey })
      .catch(e => Rx.Observable.of([]))
      .map(ordersArray => {
        ordersArray.push(this._orderFactory.createWith({lines}));
        return ordersArray;
      })
      .flatMap(ordersArray => RxLocalStorage.saveLocalStorage({ localStorageKey: this._localStorageKey, value: ordersArray }));
  }
}
