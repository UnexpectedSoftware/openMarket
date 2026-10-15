/** @import Category from '../category/Category' */
/** @import Product from './Product' */

/**
 * @typedef {object} NewProduct
 * @property {string} barcode
 * @property {string} name
 * @property {string} description
 * @property {import('../money/Money').default | number | string} price
 * @property {import('../money/Money').default | number | string} basePrice
 * @property {number} stock
 * @property {number} stockMin
 * @property {boolean} [weighted]
 * @property {Category} category
 * @property {string} [status]
 * @property {string | null} [imageName]
 */

/**
 * Port for building a product.
 * Adapters declare `@implements {ProductFactory}`; they do not extend this class.
 * @interface
 */
export default class ProductFactory {

  /**
   * @param {NewProduct} product
   * @returns {Product}
   */
  createWith({ barcode, name, description, price, basePrice, stock, stockMin, weighted, category, status, imageName }) {
    throw new Error('ProductFactory#createWith must be implemented');
  }
}
