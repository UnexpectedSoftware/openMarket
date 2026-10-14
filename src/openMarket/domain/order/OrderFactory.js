/** @import Order from './Order' */
/** @import { OrderLine } from './Order' */

/**
 * Port for building an order.
 * Adapters declare `@implements {OrderFactory}`; they do not extend this class.
 * @interface
 */
export default class OrderFactory {

  /**
   * @param {{id?: string, lines?: OrderLine[], date?: string}} order
   * @returns {Order}
   */
  createWith({id, lines, date} = {}) {
    throw new Error('OrderFactory#createWith must be implemented');
  }

}
