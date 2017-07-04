import OrderRepository from "../../domain/order/OrderRepository";
import RxLocalStorage from "../service/RxLocalStorage";
import * as Rx from "rxjs";

export default class LocalStorageOrderRepository extends OrderRepository {

  constructor({orderFactory}){
    super();
    this._localStorageKey = 'orders';
    this._orderFactory = orderFactory;
  }

  findById({id}) {
    return null;
  }

  findAll({limit, offset}) {
    return null;
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
