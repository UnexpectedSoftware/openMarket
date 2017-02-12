/**
 * @class Order
 */
export default class Order {

  /**
   * @param {IdGenerator} idGenerator
   * @param {Array.<OrderLine>} lines
   */
  contructor({ idGenerator, lines }) {
        /**
         * @type {String}
         * */
    this.id = idGenerator.generate();

        /**
         * @type {Date}
         * */
    this.createdAt = new Date().toLocaleString('es-ES');
    /**
     * @type {number}
     */
    this.total = this.getTotalAmount();
  }


  getTotalAmount() {

  }

}

class OrderLine {

  constructor({ productName, productDescription, productQuantity, productPrice }) {
    this.productName = productName;
    this.productDescription = productDescription;
    this.productQuantity = productQuantity;
    this.productPrice = productPrice;
  }
}
