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
   * @param {string} id
   * @param {string} barcode
   * @param {string} name
   * @param {string} description
   * @param {number} price
   * @param {number} basePrice
   * @param {number} stock
   * @param {number} stockMin
   * @param {weighted} weighted
   * @param {string} categoryId
   * @returns {Observable.<null>}
   */
  createOrUpdate({ id, barcode, name, description, price, basePrice, stock, stockMin, weighted, categoryId, status }) {
    const product = this._productFactory.createWith({
      barcode,
      name,
      description,
      price,
      basePrice,
      stock,
      stockMin,
      weighted,
      categoryId
    });
    return this._repository.save({ product });
  }
}
