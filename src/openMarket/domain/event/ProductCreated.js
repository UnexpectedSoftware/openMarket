/**
 * A new product was stored. An update of an existing barcode is not this event.
 */
export default class ProductCreated {

  static get type() {
    return 'ProductCreated';
  }

  /**
   * Stored even before a durable subscriber exists.
   * @returns {boolean}
   */
  static get durable() {
    return true;
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
