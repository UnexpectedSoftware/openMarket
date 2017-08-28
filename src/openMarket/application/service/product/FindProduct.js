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
   * Find a product by ID
   * @param {string} id
   * @returns {Observable.<Product>}
   */
  findProductById({ id }) {
    return this._productRepository.findById({ id });
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
