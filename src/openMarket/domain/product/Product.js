import ProductStatus from "./ProductStatus";
import Money from '../money/Money';
/** @import Category from '../category/Category' */

/**
 * @class Product
 */
export default class Product {
    /**
     * @param {object} params
     * @param {string} params.barcode
     * @param {string} params.name
     * @param {string} params.description
     * @param {Money | number | string} params.price
     * @param {Money | number | string} params.basePrice
     * @param {number} params.stock
     * @param {number} params.stockMin
     * @param {boolean} params.weighted
     * @param {Category} params.category
     * @param {string} params.status
     * @param {string | null} [params.imageName]
     */
  constructor({ barcode, name, description, price, basePrice, stock, stockMin, weighted, category, status, imageName = null }) {

      /**
       *
       * @type {string}
       * @private
       */
    this._barcode = barcode;

      /**
       *
       * @type {string}
       * @private
       */
    this._name = name;

      /**
       *
       * @type {string}
       * @private
       */
    this._description = description;

      /**
       * @type {Money}
       * @private
       */
    this._price = Money.from(price == null ? 0 : price);

      /**
       * Price without profit
       * @type {Money}
       * @private
       */
    this._basePrice = Money.from(basePrice == null ? 0 : basePrice);

      /**
       *
       * @type {number}
       * @private
       */
    this._stock = stock;

    /**
       *
       * @type {number}
       * @private
       */
    this._stockMin = stockMin;


      /**
       *
       * @type {boolean}
       * @private
       */
    this._weighted = weighted;

      /**
       *
       * @type {Category}
       * @private
       */
    this._category = category;
      /**
       *
       * @type {string}
       * @private
       */
    this._status = status;

      /**
       * Filename stored next to the database, or null
       * @type {string | null}
       * @private
       */
    this._imageName = imageName || null;

  }


  get barcode() {
    return this._barcode;
  }

  get name() {
    return this._name;
  }

  get description() {
    return this._description;
  }

  /** @returns {Money} */
  get price() {
    return this._price;
  }

  /** @returns {Money} */
  get basePrice() {
    return this._basePrice;
  }

  get stock() {
    return this._stock;
  }

  get stockMin() {
    return this._stockMin;
  }

  get isWeighted() {
    return this._weighted;
  }

  get category() {
    return this._category;
  }

  get status() {
    return this._status;
  }

  get imageName() {
    return this._imageName;
  }

  /**
   * @param {{quantity: number}} change
   * @returns {Product}
   */
  addStock({ quantity }) {
    this._stock += quantity;
    return this;
  }

  /**
   * @param {{quantity: number}} change
   * @returns {Product}
   */
  subtractStock({ quantity }) {
    this._stock -= quantity;
    return this;
  }

  /**
   * Stock left is at or below the minimum. A missing stock or minimum is not low.
   * @returns {boolean}
   */
  isStockLow() {
    if (this._stock == null || this._stockMin == null) {
      return false;
    }
    return this._stock <= this._stockMin;
  }

  /**
   * @returns {boolean}
   */
  isDisabled() {
    return this._status === ProductStatus.DISABLED;
  }

  /**
   * @returns {Product}
   */
  disable() {
    this._status = ProductStatus.DISABLED;
    return this;
  }

  /**
   * @returns {Product}
   */
  enable() {
    this._status = ProductStatus.ENABLED;
    return this;
  }


}
