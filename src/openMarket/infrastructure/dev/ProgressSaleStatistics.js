/** @typedef {import('../../domain/product/ProductSaleStatisticsRepository').default} ProductSaleStatisticsRepository */
/** @typedef {import('../../domain/product/ProductSaleStatisticsRepository').SaleLine} SaleLine */
/** @typedef {import('../../domain/product/ProductSaleStatisticsRepository').SalePoint} SalePoint */
/** @typedef {import('../../domain/product/ProductSaleStatisticsRepository').MostSoldProduct} MostSoldProduct */
/** @typedef {import('../../domain/product/ProductSaleStatisticsRepository').SoldQuantity} SoldQuantity */

/**
 * Forwards the sale statistics and tells the fixtures bar each time an order is applied.
 * The Informes screen reads those counters. Only the fixtures container builds this.
 * @implements {ProductSaleStatisticsRepository}
 */
export default class ProgressSaleStatistics {

  /**
   * @param {{repository: ProductSaleStatisticsRepository, onApply: () => void}} deps
   */
  constructor({repository, onApply}) {
    this._repository = repository;
    this._onApply = onApply;
  }

  /** @returns {boolean} */
  isEmpty() {
    return this._repository.isEmpty();
  }

  /** Replace every daily counter from the stored order lines. */
  rebuildFromOrders() {
    this._repository.rebuildFromOrders();
  }

  /**
   * @param {{orderId?: string | null, createdAt: string, lines: SaleLine[]}} order
   */
  applyOrder(order) {
    this._repository.applyOrder(order);
    this._onApply();
  }

  /**
   * @param {{barcode: string, startOn: string, endOn: string, bucket: string}} query
   * @returns {SalePoint[]}
   */
  series(query) {
    return this._repository.series(query);
  }

  /**
   * @param {{startOn: string, endOn: string, limit: number}} query
   * @returns {MostSoldProduct[]}
   */
  mostSold(query) {
    return this._repository.mostSold(query);
  }

  /**
   * @param {{barcodes: string[], startOn: string, endOn: string}} query
   * @returns {SoldQuantity[]}
   */
  quantities(query) {
    return this._repository.quantities(query);
  }

}
