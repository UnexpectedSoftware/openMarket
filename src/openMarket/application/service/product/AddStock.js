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
      .map(product => {
        // TODO Pattern state for product and use setter
        product._stock += quantity;
        return product;
      })
      .flatMap(product => this._productRepository.save({ product }));
  }
}
