/** @import ProductFilter from './ProductFilter' */

/**
 * Port for building a product list filter.
 * Adapters declare `@implements {ProductFilterFactory}`; they do not extend this class.
 * @interface
 */
export default class ProductFilterFactory {

  /**
   * @param {{limit: number, offset: number}} filter
   * @returns {ProductFilter}
   */
  createWith({ limit, offset }) {
    throw new Error('ProductFilterFactory#createWith must be implemented');
  }

  /**
   * @returns {ProductFilter}
   */
  createWithDefaults() {
    throw new Error('ProductFilterFactory#createWithDefaults must be implemented');
  }
}
