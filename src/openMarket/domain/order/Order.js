/**
 * @class Order
 */
import moment from "moment";
export default class Order {

  /**
   * @param {String} id
   * @param {Array.<Line>} lines
   * @param {date} date
   */
  constructor({ id, lines, date=moment().format("DD/MM/YYYY HH:mm:ss") } = {}) {
  /**
   * @type {String}
   * */
    this._id = id;

  /**
   * @type {Date}
   * */
    this._createdAt = date;
    /**
     *
     * @type {Array.<Line>}
     * @private
     */
    this._lines = lines;

  /**
   * @type {number}
   */
    this._total = this._getTotalAmount();
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


  get total() {
    return this._total;
  }

  _getTotalAmount() {
    return this._lines.reduce((acc, element) => acc + (element.price * element.quantity) ,0);
  }

}
