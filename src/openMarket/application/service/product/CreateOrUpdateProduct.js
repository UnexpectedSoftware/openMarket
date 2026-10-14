/**
 * @class CreateOrUpdateProduct
 */
import * as Rx from "rxjs";
/** @import { Observable } from 'rxjs/Observable' */
/** @import CategoryRepository from '../../../domain/category/CategoryRepository' */
/** @import ProductFactory from '../../../domain/product/ProductFactory' */
/** @import ProductRepository from '../../../domain/product/ProductRepository' */

export default class CreateOrUpdateProduct {
  /**
   * Create use case
   * @param {object} deps
   * @param {ProductRepository} deps.productRepository
   * @param {ProductFactory} deps.productFactory
   * @param {CategoryRepository} deps.categoryRepository
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
   * @param {object} product
   * @param {string} product.barcode
   * @param {string} product.name
   * @param {string} product.description
   * @param {number} product.price
   * @param {number} product.basePrice
   * @param {number} product.stock
   * @param {number} product.stockMin
   * @param {boolean} product.weighted
   * @param {string} product.categoryId
   * @param {string} product.status
   * @param {string | null} [product.imagePath] absolute path of a file to copy, when the user picked one
   * @returns {Observable<null>}
   */
  createOrUpdate({ barcode, name, description, price, basePrice, stock, stockMin, weighted, categoryId, status, imagePath }) {
    return this._categoryRepository.findById({id: categoryId})
      .map(category => this._productFactory.createWith({
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
      .flatMap(product => this._productRepository.save({ product, imagePath }));
  }
}
