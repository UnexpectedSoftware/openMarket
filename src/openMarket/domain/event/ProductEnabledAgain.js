/**
 * A disabled product was sold, so it is enabled and its stock grew by one.
 */
export default class ProductEnabledAgain {

  static get type() {
    return 'ProductEnabledAgain';
  }

  /**
   * @param {object} params
   * @param {string} params.barcode
   * @param {string} params.name
   */
  constructor({barcode, name}) {
    this.barcode = barcode;
    this.name = name;
  }

}
