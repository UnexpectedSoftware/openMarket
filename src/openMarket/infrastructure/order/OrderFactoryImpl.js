import Order from "../../domain/order/Order";
/** @import OrderFactory from "../../domain/order/OrderFactory" */
/** @import { OrderLine } from "../../domain/order/Order" */

/** @implements {OrderFactory} */
export default class OrderFactoryImpl {

  constructor({identity}){
    this._identity = identity;
  }

  /**
   * Builds a draft. The caller places it before saving.
   * @param {{id?: string, lines?: OrderLine[], date?: string}} [order]
   * @returns {Order}
   */
  createWith({id = this._identity.generate(), lines, date} = {}) {
    return new Order({
        id: id,
        lines: lines || [],
        date: date
      });
  }
}
