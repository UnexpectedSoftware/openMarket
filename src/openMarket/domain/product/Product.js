/**
 * @class Product
 */
export default class Product {
    /**
     * @constructs Product
     * @param {string} id
     * @param {string} barcode
     * @param {string} name
     * @param {string} description
     * @param {number} price
     * @param {number} basePrice
     * @param {number} stock
     * @param {number} stockMin
     * @param {boolean} weighted
     * @param {Category} category
     * @param {string} status
     */
  constructor({ id, barcode, name, description, price, basePrice, stock, stockMin, weighted, category, status }) {

      /**
       *
       * @type {string}
       * @private
       */
    this._id = id;

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
       *
       * @type {number}
       * @private
       */
    this._price = price;

      /**
       * Price without profit
       * @type {number}
       * @private
       */
    this._basePrice = basePrice;

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

  }


  get id() {
    return this._id;
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

  get price() {
    return this._price;
  }

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

  /**
     *
     * @param {number} quantity
     */
  addStock({ quantity }) {
    this._stock += quantity;
    return this;
  }

    /**
     *
     * @param {number} quantity
     */
  subtractStock({ quantity }) {
    this._stock -= quantity;
    return this;
  }


}
