/**
 * @interface
 * */
export default class ProductFilterFactory {
    /**
     *
     * @param {number} limit
     * @param {number} offset
     */
  createWith({ limit, offset }) {
    throw new Error('ProductFilterFactory#ProductFilter must be implemented');
  }
  createWithDefaults() {
    throw new Error('ProductFilterFactory#ProductFilter must be implemented');
  }
}
