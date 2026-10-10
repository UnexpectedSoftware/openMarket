import "rxjs/add/operator/defaultIfEmpty";
import "rxjs/add/operator/mergeMap";
import ProductNotFoundError from "../../../domain/product/ProductNotFoundError";
import observableError from "../../../infrastructure/logging/observableError";

/**
 * @class DisableProduct
 */
export default class DisableProduct {
  /**
   *
   * @param {ProductRepository} repository
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
   * @param {string} barcode
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
