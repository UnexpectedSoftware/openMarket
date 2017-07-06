/**
 * @class Order
 */
export default class Order {

  /**
   * @param {IdGenerator} idGenerator
   * @param {Array.<Line>} lines
   */
  constructor({ idGenerator, lines }) {
  /**
   * @type {String}
   * */
    this._id = idGenerator.generate();

  /**
   * @type {Date}
   * */
    this._createdAt = new Date().toLocaleString('es-ES');
    /**
     *
     * @type {Array.<Line>}
     * @private
     */
    this._lines = lines;

  /**
   * @type {number}
   */
    this._total = this.getTotalAmount();
  }


  get id() {
    return this._id;
  }

  get createdAt() {
    return this._createdAt;
  }

  get lines() {
    return this._lines;
  }



  getTotalAmount() {
    return this._lines.reduce((acc, element) => acc + (element.price * element.quantity) ,0);
  }

}

class Line {

  constructor({ productName, productQuantity, productPrice }) {
    this._productName = productName;
    this._productQuantity = productQuantity;
    this._productPrice = productPrice;
  }
}
