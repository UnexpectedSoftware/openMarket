/**
 * A disabled product was sold, so it is enabled and its stock grew by one.
 */
export default class ProductEnabledAgain {

  /**
   * @param {string} barcode
   * @param {string} name
   */
  constructor({barcode, name}) {
    this.barcode = barcode;
    this.name = name;
  }

}
