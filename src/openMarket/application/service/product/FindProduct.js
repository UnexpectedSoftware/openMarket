/**
 * @class FindProductById
 */
export default class FindProduct {

    /**
     * @constructs FindProduct
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
   *
   * @param {string} barcode
   * @returns {Observable.<Product>}
   */
  findProductByBarcode({ barcode }) {
    return this._productRepository.findByBarcode({ barcode });
  }

}
