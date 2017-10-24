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
     * @param {imageUrl} imageUrl
     * @param {Category} category
     * @param {string} status
     * @returns {Product}
     */
  createWith({ barcode, name, description, price, basePrice, stock, stockMin, weighted, category, status = ProductStatus.ENABLED} = {}) {
    return new Product({
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
    });
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
    return new Product({
      id: id,
      barcode: barcode,
      name: name,
      description: description,
      price: price,
      basePrice: basePrice,
      stock: stock,
      stockMin: stockMin,
      weighted: weighted,
      category: category,
      status: status
    });
  }


}
