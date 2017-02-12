import ProductStatus from "../../../domain/product/ProductStatus";
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
    this._repository = repository;
  }

  /**
   *
   * @param {string} id
   * @returns {Observable<null>}
   */
  disable({ id }) {
    this._repository.findById({id})
      .flatMap(product => {
        product.status = ProductStatus.DISABLED;
        return this._repository.save({product});
      })
  }

}
