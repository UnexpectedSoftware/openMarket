import "rxjs/add/operator/defaultIfEmpty";
import "rxjs/add/operator/mergeMap";
import ProductNotFoundError from "../../../domain/product/ProductNotFoundError";
import observableError from "../../../infrastructure/logging/observableError";
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/product/ProductRepository').default} ProductRepository */

/**
 * @class DisableProduct
 */
export default class DisableProduct {
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
   * Mark a product disabled. The row stays, so old order lines still point at it.
   * @param {{barcode: string}} command
   * @returns {Observable<null>}
   */
  disable({ barcode }) {
    return this._productRepository.findByBarcode({ barcode })
      .defaultIfEmpty(null)
      .flatMap(product => {
        if (!product) {
          return observableError(new ProductNotFoundError({barcode, operation: 'disable'}));
        }
        return this._productRepository.save({product: product.disable()});
      });
  }

}
