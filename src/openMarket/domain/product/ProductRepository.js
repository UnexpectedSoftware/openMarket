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

  findAllWithLowStock({  limit, offset }){
    throw new Error('ProductRepository#product must be implemented');
  }

  /**
   *
   * @param {Product} product
   * @param {?string} imagePath absolute path of a file to copy, when the user picked one
   * @returns {Observable<null>}
   */
  save({ product, imagePath }) {
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

  findAllStatuses(){
    throw new Error('ProductRepository#product must be implemented');
  }

  /**
   * @returns {Observable<number>}
   */
  countProducts(){
    throw new Error('ProductRepository#product must be implemented');
  }

  countProductsByName({name}){
    throw new Error('ProductRepository#product must be implemented');
  }

  countProductsWithLowStock(){
    throw new Error('ProductRepository#product must be implemented');
  }

  /**
   * One page of products, ordered by barcode. Includes disabled products.
   * @param {number} limit
   * @param {number} offset
   * @returns {Observable<Array<Product>>}
   */
  findPage({limit, offset}) {
    throw new Error('ProductRepository#findPage must be implemented');
  }

  /**
   * @param {string} barcode
   * @param {string} imagePath absolute path of a file to copy
   * @returns {Observable<null>}
   */
  updateProduct({barcode, imagePath}) {
    throw new Error('ProductRepository#updateProduct must be implemented');
  }
}
