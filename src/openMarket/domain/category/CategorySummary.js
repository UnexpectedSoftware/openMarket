/**
 * Read model for one category card: the category plus its product totals.
 */
export default class CategorySummary {

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.name
   * @param {string | null} [params.imageName]
   * @param {number} params.productCount
   * @param {number} params.stockTotal
   * @param {number} params.basePriceTotal
   * @param {{barcode: string, name: string, quantity: number} | null} [params.mostSold]
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
