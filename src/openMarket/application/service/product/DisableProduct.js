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
      .map(product => product.disable())
      .flatMap(product => this._productRepository.save({ product }));
  }

}
