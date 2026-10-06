/**
 * Read model for one category card: the category plus its product totals.
 */
export default class CategorySummary {

  /**
   * @param {string} id
   * @param {string} name
   * @param {?string} imageName
   * @param {number} productCount
   * @param {number} stockTotal
   * @param {number} basePriceTotal
   * @param {?{name: string, quantity: number}} mostSold
   */
  constructor({
    id,
    name,
    imageName = null,
    productCount,
    stockTotal,
    basePriceTotal,
    mostSold = null
  }) {
    this._id = id;
    this._name = name;
    this._imageName = imageName || null;
    this._productCount = productCount;
    this._stockTotal = stockTotal;
    this._basePriceTotal = basePriceTotal;
    this._mostSold = mostSold;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get imageName() {
    return this._imageName;
  }

  get productCount() {
    return this._productCount;
  }

  get stockTotal() {
    return this._stockTotal;
  }

  get basePriceTotal() {
    return this._basePriceTotal;
  }

  get mostSold() {
    return this._mostSold;
  }
}
