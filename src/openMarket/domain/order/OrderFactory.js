/** @typedef {import('./Order').default} Order */
/** @typedef {import('./Order').OrderLine} OrderLine */

/**
 * Port for building a draft order. Placing it is a separate step.
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
