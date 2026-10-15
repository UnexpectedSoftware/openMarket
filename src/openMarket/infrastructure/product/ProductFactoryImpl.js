import Product from '../../domain/product/Product';
import ProductStatus from "../../domain/product/ProductStatus";
/** @import ProductFactory from '../../domain/product/ProductFactory' */
/** @import { NewProduct } from '../../domain/product/ProductFactory' */
/** @import Identity from '../../domain/Identity' */

/** @implements {ProductFactory} */
export default class ProductFactoryImpl {
    /**
     * @param {object} deps
     * @param {Identity} deps.identity
     */
  constructor({ identity }) {
      /**
       *
       * @type {Identity}
       * @private
       */
    this._identity = identity;
  }

    /**
     * @param {Partial<NewProduct>} [product]
     * @returns {Product}
     */
  createWith({ barcode, name, description, price, basePrice, stock, stockMin, weighted, category, status = ProductStatus.ENABLED, imageName = null, vatRate = null} = {}) {
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
      status,
      imageName,
      vatRate
    });
  }

}
