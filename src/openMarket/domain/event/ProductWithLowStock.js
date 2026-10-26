/**
 * One product whose stock is at or below its minimum after a sale.
 */
export default class ProductWithLowStock {

  static get type() {
    return 'ProductWithLowStock';
  }

  /**
   * @param {object} params
   * @param {string} params.barcode
   * @param {string} params.name
   * @param {number} params.stock
   * @param {number} params.stockMin
   * @param {boolean} [params.weighted] Sold by weight, so the remaining stock is kilograms.
   */
  constructor({barcode, name, stock, stockMin, weighted}) {
    this.barcode = barcode;
    this.name = name;
    this.stock = stock;
    this.stockMin = stockMin;
    this.weighted = weighted === true;
  }

}
