/**
 * @interface
 * */
export default class ProductRepository {
    /**
     *
     * @param {ProductFilter} productFilter
     * @returns {Observable<Product>}
     */
  findAll({ productFilter }) {
    throw new Error('ProductRepository#product must be implemented');
  }

    /**
     *
     * @param {string} name
     * @param {number} limit
     * @param {number} offset
     * @returns {Observable<Product>}
     */
  findAllByName({ name, limit, offset }) {
    throw new Error('ProductRepository#product must be implemented');
  }

    /**
     *
     * @param {Product} product
     * @returns {Observable<null>}
     */
  save({ product }) {
    throw new Error('ProductRepository#product must be implemented');
  }

    /**
     *
     * @param {string} id
     * @returns {Observable.<Product>}
     */
  findById({ id }) {
    throw new Error('ProductRepository#product must be implemented');
  }

    /**
     *
     * @param {string} barcode
     * @returns {Observable<Product>}
     */
  findByBarcode({ barcode }) {
    throw new Error('ProductRepository#product must be implemented');
  }

  /**
   * @returns {Observable<number>}
   */
  countProducts(){
    throw new Error('ProductRepository#product must be implemented');
  }
}
