/**
 * One product whose stock is at or below its minimum after a sale.
 */
export default class ProductWithLowStock {

  /**
   * @param {string} barcode
   * @param {string} name
   * @param {number} stock
   * @param {number} stockMin
   */
  constructor({barcode, name, stock, stockMin}) {
    this.barcode = barcode;
    this.name = name;
    this.stock = stock;
    this.stockMin = stockMin;
  }

}
