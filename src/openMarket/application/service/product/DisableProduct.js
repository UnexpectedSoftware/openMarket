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
    this._productRepository = repository;
  }

  /**
   *
   * @param {string} id
   * @returns {Observable<null>}
   */
  disable({ id }) {
    this._productRepository.findById({id})
      .flatMap(product => {
        product.status = ProductStatus.DISABLED;
        return this._productRepository.save({product});
      })
  }

}
