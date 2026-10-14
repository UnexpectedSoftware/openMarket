/** @import { Observable } from 'rxjs/Observable' */
/** @import Product from '../../../domain/product/Product' */
/** @import ProductRepository from '../../../domain/product/ProductRepository' */

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
