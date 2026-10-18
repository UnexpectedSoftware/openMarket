/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/product/Product').default} Product */
/** @typedef {import('../../../domain/product/ProductRepository').default} ProductRepository */

/**
 * @class FindProductById
 */
export default class FindProduct {

    /**
     * @param {{repository: ProductRepository}} deps
     */
  constructor({ repository }) {
      /**
       *
        * @type {ProductRepository}
       * @private
       */
    this._productRepository = repository;
  }

  /**
   * @param {{barcode: string}} query
   * @returns {Observable<Product>}
   */
  findProductByBarcode({ barcode }) {
    return this._productRepository.findByBarcode({ barcode });
  }

}
