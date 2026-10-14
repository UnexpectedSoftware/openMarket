import moment from "moment";
import {add, multiply} from "../../infrastructure/service/floatCalculatorService";
import EmptyOrderLinesError from "./EmptyOrderLinesError";
import InvalidOrderQuantityError from "./InvalidOrderQuantityError";

/**
 * One line stored on an order.
 * @typedef {object} OrderLine
 * @property {string} barcode
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 */

/**
 * @class Order
 */
export default class Order {

  /**
   * @param {object} [params]
   * @param {string} [params.id]
   * @param {OrderLine[]} [params.lines]
   * @param {string} [params.date]
   */
  constructor({ id, lines, date=moment().format("DD/MM/YYYY HH:mm:ss") } = {}) {
  /**
   * @type {String}
   * */
    this._id = id;

  /**
   * @type {string}
   * */
    this._createdAt = date;

    if (lines == null || lines.length === 0) {
      throw new EmptyOrderLinesError();
    }
    lines.forEach(line => {
      const quantity = Number(line && line.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new InvalidOrderQuantityError({
          quantity: line && line.quantity,
          barcode: line && line.barcode
        });
      }
    });

    /**
     * @type {OrderLine[]}
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
    return this._lines.reduce((acc, element) =>
      add(acc,multiply(element.price,element.quantity)),0);
  }

}
