import OrderFactory from "../../domain/order/OrderFactory";
import Order from "../../domain/order/Order";
export default class OrderFactoryImpl extends OrderFactory {

  constructor({identity}){
    super();
    this._identity = identity;
  }

  createWith({id = this._identity.generate(), lines, date} = {}) {
    return new Order({
        id: id,
        lines: lines,
        date: date
      });
  }
}
