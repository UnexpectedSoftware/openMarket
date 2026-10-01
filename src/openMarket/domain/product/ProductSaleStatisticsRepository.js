/**
 * @interface
 */
export default class ProductSaleStatisticsRepository {

  /**
   * @returns {boolean}
   */
  isEmpty() {
    throw new Error('ProductSaleStatisticsRepository#isEmpty must be implemented');
  }

  /**
   * Replace every daily counter from the stored order lines.
   */
  rebuildFromOrders() {
    throw new Error('ProductSaleStatisticsRepository#rebuildFromOrders must be implemented');
  }

  /**
   * Add one order's lines into the daily counters.
   * @param {string} createdAt
   * @param {Array} lines
   */
  applyOrder({createdAt, lines}) {
    throw new Error('ProductSaleStatisticsRepository#applyOrder must be implemented');
  }

  /**
   * @param {string} barcode
   * @param {string} startOn YYYY-MM-DD
   * @param {string} endOn YYYY-MM-DD
   * @param {string} bucket day or month
   * @returns {Array.<{soldOn: string, quantity: number, amount: number}>}
   */
  series({barcode, startOn, endOn, bucket}) {
    throw new Error('ProductSaleStatisticsRepository#series must be implemented');
  }

  /**
   * @param {string} startOn
   * @param {string} endOn
   * @param {number} limit
   * @returns {Array.<{barcode: string, name: string, quantity: number, amount: number}>}
   */
  mostSold({startOn, endOn, limit}) {
    throw new Error('ProductSaleStatisticsRepository#mostSold must be implemented');
  }

}
