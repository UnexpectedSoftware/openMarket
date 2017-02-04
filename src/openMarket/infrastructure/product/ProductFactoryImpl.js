import ProductFactory from '../../domain/product/ProductFactory';
import Product from '../../domain/product/Product';
/**
 * @class ProductFactoryImpl
 * @implements ProductFactory
 */
export default class ProductFactoryImpl extends ProductFactory {
    /**
     *
     * @param {Identity} identity
     */
  constructor({ identity }) {
    super();
        /**
         * @type {Identity}
         * @member ProductFactoryImpl#identity
         */
    this.identity = identity;
  }

    /**
     *
     * @param {string} barcode
     * @param {string} name
     * @param {string} description
     * @param {number} price
     * @param {number} stock
     * @returns {Product}
     */
  createWith({ barcode, name, description, price, stock }) {
    return new Product({
      identity: this.identity,
      barcode,
      name,
      description,
      price,
      stock
    });
  }
    // TODO Refactor this shit
    /**
     *
     * @param {string} barcode
     * @param {string} name
     * @param {string} description
     * @param {number} price
     * @param {number} stock
     * @param {string} imageUrl
     * @returns {Product}
     */
  createWithImage({ barcode, name, description, price, stock, imageUrl, categoryId }) {
    return new Product({
      identity: this.identity,
      barcode,
      name,
      description,
      price,
      stock,
      imageUrl,
      categoryId
    });
  }

    /**
     *
     * @param {Category} category
     * @param {string} barcode
     * @param {string} name
     * @param {string} description
     * @param {number} price
     * @param {number} stock
     */
  createWithCategory({ category, barcode, name, description, price, stock }) {
    throw new Error('ProductFactory#product must be implemented');
  }
}
