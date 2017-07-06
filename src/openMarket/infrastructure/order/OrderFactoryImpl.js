import OrderFactory from "../../domain/order/OrderFactory";
import Order from "../../domain/order/Order";
export default class OrderFactoryImpl extends OrderFactory {

  constructor({identity}){
    super();
    this._identity = identity;
  }

  createWith({lines}) {
    return new Order(
      {
        idGenerator: this._identity,
        lines: lines
      });
  }
}
