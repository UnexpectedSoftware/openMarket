/**
 * @class CreateOrUpdateProduct
 */
import * as Rx from "rxjs";

export default class CreateOrUpdateProduct {
  /**
   * Create use case
   * @param {ProductRepository} productRepository
   * @param {ProductFactory} productFactory
   */
  constructor({ productRepository, productFactory, categoryRepository }) {
    /**
     *
     * @type {ProductRepository}
     * @private
     */
    this._productRepository = productRepository;
    /**
     *
     * @type {ProductFactory}
     * @private
     */
    this._productFactory = productFactory;
    /**
     * @type {CategoryRepository}
     * @private
     */
    this._categoryRepository = categoryRepository;
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
   * @param {boolean} weighted
   * @param {string} categoryId
   * @param {string} status
   * @returns {Observable.<null>}
   */
  createOrUpdate({ id, barcode, name, description, price, basePrice, stock, stockMin, weighted, categoryId, status }) {
    return this._categoryRepository.findById({id: categoryId})
      .flatMap(category =>
        Rx.Observable.of(id)
          .filter(productId => undefined !== productId)
          .map(productId => this._productFactory.createWithId({
            id:productId,
            barcode,
            name,
            description,
            price,
            basePrice,
            stock,
            stockMin,
            weighted,
            category,
            status
          }))
          .defaultIfEmpty(this._productFactory.createWith({
            barcode,
            name,
            description,
            price,
            basePrice,
            stock,
            stockMin,
            weighted,
            category,
          }))
      )
      .flatMap(product => this._productRepository.save({ product }));
  }
}
