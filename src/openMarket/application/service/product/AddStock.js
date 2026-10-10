import "rxjs/add/operator/defaultIfEmpty";
import "rxjs/add/operator/mergeMap";
import ProductNotFoundError from "../../../domain/product/ProductNotFoundError";
import observableError from "../../../infrastructure/logging/observableError";

/**
 * @class AddStock
 */
export default class AddStock {

    /**
     * @constructs AddStock
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
   * Add stock quantity for a product by barcode
   * @param {string} barcode
   * @param {number} quantity
   * @returns {Observable.<null>}
   */
  addStock({ barcode, quantity }) {

    return this._productRepository.findByBarcode({ barcode })
      .defaultIfEmpty(null)
      .flatMap(product => {
        if (!product) {
          return observableError(new ProductNotFoundError({barcode, operation: 'addStock'}));
        }
        // TODO Pattern state for product and use setter
        product._stock += quantity;
        return this._productRepository.save({ product });
      });
  }
}
