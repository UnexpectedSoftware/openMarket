import ProductFactory from '../../domain/product/ProductFactory';
import Product from '../../domain/product/Product';
import ProductStatus from "../../domain/product/ProductStatus";
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
       *
       * @type {Identity}
       * @private
       */
    this._identity = identity;
  }

    /**
     *
     * @param {string} barcode
     * @param {string} name
     * @param {string} description
     * @param {number} price
     * @param {number} basePrice
     * @param {number} stock
     * @param {number} stockMin
     * @returns {Product}
     */
  createWith({ barcode, name, description, price, basePrice, stock, stockMin }) {
    return new Product({
      id: this._identity.generate(),
      barcode: barcode,
      name: name,
      description: description,
      price: price,
      basePrice: basePrice,
      stock: stock,
      stockMin: stockMin,
      imageUrl: "defaultImage.png",
      categoryId: "",
      status: ProductStatus.ENABLED
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
      id: this._identity.generate(),
      barcode,
      name,
      description,
      price,
      basePrice:0,
      stock,
      stockMin:10,
      imageUrl,
      categoryId,
      status: ProductStatus.ENABLED
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
