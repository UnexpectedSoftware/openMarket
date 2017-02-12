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
    this._repository = repository;
  }

  /**
   * Find a product by ID
   * @param {string} id
   * @returns {Observable.<Product>}
   */
  findProductById({ id }) {
    return this._repository.findById({ id });
  }

  /**
   *
   * @param {string} barcode
   * @returns {Observable.<Product>}
   */
  findProductByBarcode({ barcode }) {
    return this._repository.findByBarcode({ barcode });
  }

}
