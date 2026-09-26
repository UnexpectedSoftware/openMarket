/**
 * @interface
 * */
export default class ProductFactory {

  /**
   *
   * @param {string} barcode
   * @param {string} name
   * @param {string} description
   * @param {number} price
   * @param {number} basePrice
   * @param {number} stock
   * @param {number} stockMin
   * @param {?string} imageName
   * @param {Category} category
   * @returns {Product}
   */
  createWith({ barcode, name, description, price, basePrice, stock, stockMin, weighted, category, status, imageName }) {
    throw new Error('ProductFactory#createWith must be implemented');
  }
}
