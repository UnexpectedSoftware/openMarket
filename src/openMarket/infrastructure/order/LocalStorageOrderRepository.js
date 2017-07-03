import OrderRepository from "../../domain/order/OrderRepository";
import RxLocalStorage from '../service/RxLocalStorage';
import Order from "../../domain/order/Order";

export default class LocalStorageOrderRepository extends OrderRepository {

  constructor(){
    super();
    this._localStorageKey = 'orders';

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
      .map(ordersArray => {
        ordersArray.push(new Order({lines}));
        return ordersArray;
      })
      .flatMap(ordersArray => RxLocalStorage.saveLocalStorage({ localStorageKey: this._localStorageKey, value: ordersArray }));
  }
}
