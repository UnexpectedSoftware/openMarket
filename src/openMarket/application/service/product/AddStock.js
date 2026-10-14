import "rxjs/add/operator/defaultIfEmpty";
import "rxjs/add/operator/mergeMap";
import ProductNotFoundError from "../../../domain/product/ProductNotFoundError";
import observableError from "../../../infrastructure/logging/observableError";
/** @import { Observable } from 'rxjs/Observable' */
/** @import ProductRepository from '../../../domain/product/ProductRepository' */

/**
 * @class AddStock
 */
export default class AddStock {

    /**
     * @param {{repository: ProductRepository}} deps
     */
  constructor({ repository }) {
      /**
       * @type {ProductRepository}
       * @private
       */
    this._productRepository = repository;
  }

  /**
   * Add stock quantity for a product by barcode
   * @param {{barcode: string, quantity: number}} command
   * @returns {Observable<null>}
   */
  addStock({ barcode, quantity }) {

    return this._productRepository.findByBarcode({ barcode })
      .defaultIfEmpty(null)
      .flatMap(product => {
        if (!product) {
          return observableError(new ProductNotFoundError({barcode, operation: 'addStock'}));
        }
        product.addStock({ quantity });
        return this._productRepository.save({ product });
      });
  }
}
