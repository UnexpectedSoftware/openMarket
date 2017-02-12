/**
 * @class CreateOrUpdateProduct
 */
export default class CreateOrUpdateProduct {
  /**
   * Create use case
   * @param {ProductRepository} repository
   * @param {ProductFactory} productFactory
   */
  constructor({ repository, productFactory }) {
    /**
     *
     * @type {ProductRepository}
     * @private
     */
    this._repository = repository;
    /**
     *
     * @type {ProductFactory}
     * @private
     */
    this._productFactory = productFactory;
  }

  /**
   * Create or update a product
   * @param {string} barcode
   * @param {string} name
   * @param {string} description
   * @param {number} price
   * @param {number} stock
   * @param {string} imageUrl
   * @param {string} categoryId
   * @returns {Observable.<null>}
   */
  createOrUpdate({ barcode, name, description, price, stock, imageUrl, categoryId }) {
    const product = this._productFactory.createWithImage({
      barcode,
      name,
      description,
      price,
      stock,
      imageUrl,
      categoryId
    });
    return this._repository.save({ product });
  }
}
