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
   * @param {imageUrl} imageUrl
   * @param {Category} category
   * @returns {Product}
   */
  createWith({ barcode, name, description, price, basePrice, stock, stockMin, weighted, category }) {
    throw new Error('ProductFactory#product must be implemented');
  }
  /**
   * @param {string} id
   * @param {string} barcode
   * @param {string} name
   * @param {string} description
   * @param {number} price
   * @param {number} basePrice
   * @param {number} stock
   * @param {number} stockMin
   * @param {imageUrl} imageUrl
   * @param {Category} category
   * @param {string} status
   * @returns {Product}
   */
  createWithId({ id, barcode, name, description, price, basePrice, stock, stockMin, weighted, category, status }) {
    throw new Error('ProductFactory#product must be implemented');
  }
}
