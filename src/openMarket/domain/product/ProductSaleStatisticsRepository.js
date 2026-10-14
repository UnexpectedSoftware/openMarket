/**
 * One bucket of units and money sold.
 * @typedef {object} SalePoint
 * @property {string} soldOn
 * @property {number} quantity
 * @property {number} amount
 */

/**
 * One product on the most-sold list.
 * @typedef {object} MostSoldProduct
 * @property {string} barcode
 * @property {string} name
 * @property {string | null} imageName
 * @property {number} quantity
 * @property {number} amount
 */

/**
 * Units sold for one barcode in a window.
 * @typedef {object} SoldQuantity
 * @property {string} barcode
 * @property {number} quantity
 */

/**
 * One order line applied to the daily counters.
 * @typedef {object} SaleLine
 * @property {string} barcode
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 */

/**
 * Daily sale counters. These reads and writes are synchronous.
 * Adapters declare `@implements {ProductSaleStatisticsRepository}`; they do not extend this class.
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
   * The same orderId is applied once.
   * @param {{orderId?: string | null, createdAt: string, lines: SaleLine[]}} order
   */
  applyOrder({orderId, createdAt, lines}) {
    throw new Error('ProductSaleStatisticsRepository#applyOrder must be implemented');
  }

  /**
   * @param {{barcode: string, startOn: string, endOn: string, bucket: string}} query
   * @returns {SalePoint[]}
   */
  series({barcode, startOn, endOn, bucket}) {
    throw new Error('ProductSaleStatisticsRepository#series must be implemented');
  }

  /**
   * @param {{startOn: string, endOn: string, limit: number}} query
   * @returns {MostSoldProduct[]}
   */
  mostSold({startOn, endOn, limit}) {
    throw new Error('ProductSaleStatisticsRepository#mostSold must be implemented');
  }

  /**
   * @param {{barcodes: string[], startOn: string, endOn: string}} query
   * @returns {SoldQuantity[]}
   */
  quantities({barcodes, startOn, endOn}) {
    throw new Error('ProductSaleStatisticsRepository#quantities must be implemented');
  }

}
