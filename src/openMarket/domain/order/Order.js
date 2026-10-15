import moment from 'moment';
import {add, multiply} from '../../infrastructure/service/floatCalculatorService';
import OrderStatus from './OrderStatus';
import EmptyOrderLinesError from './EmptyOrderLinesError';
import InvalidOrderQuantityError from './InvalidOrderQuantityError';
import OrderAlreadyPlacedError from './OrderAlreadyPlacedError';

/**
 * One line stored on an order.
 * @typedef {object} OrderLine
 * @property {string} barcode
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 */

/**
 * A sale. A draft may have no lines. Only a placed order is saved, and
 * placing it is the one check that the lines can be sold.
 */
export default class Order {

  /**
   * An order the cashier is still filling in.
   * @param {object} [params]
   * @param {string} [params.id]
   * @param {string} [params.date]
   * @returns {Order}
   */
  static draft({id, date} = {}) {
    return new Order({id, lines: [], date, status: OrderStatus.DRAFT});
  }

  /**
   * Rebuilds an order that was already stored. The stored order was placed,
   * so its lines are not checked again.
   * @param {object} params
   * @param {string} params.id
   * @param {OrderLine[]} params.lines
   * @param {string} params.date
   * @returns {Order}
   */
  static restore({id, lines, date}) {
    return new Order({id, lines, date, status: OrderStatus.PLACED});
  }

  /**
   * @param {object} [params]
   * @param {string} [params.id]
   * @param {OrderLine[]} [params.lines]
   * @param {string} [params.date]
   * @param {string} [params.status]
   */
  constructor({id, lines = [], date = moment().format('DD/MM/YYYY HH:mm:ss'), status = OrderStatus.DRAFT} = {}) {
    /**
     * @type {string}
     * @private
     */
    this._id = id;

    /**
     * @type {string}
     * @private
     */
    this._createdAt = date;

    /**
     * @type {string}
     * @private
     */
    this._status = status;

    /**
     * @type {OrderLine[]}
     * @private
     */
    this._lines = copyLines(lines);

    /**
     * @type {number}
     * @private
     */
    this._total = this._getTotalAmount();
  }

  /** @returns {string} */
  get id() {
    return this._id;
  }

  /** @returns {string} */
  get createdAt() {
    return this._createdAt;
  }

  /** @returns {OrderLine[]} */
  get lines() {
    return this._lines.map(line => ({
      barcode: line.barcode,
      name: line.name,
      price: line.price,
      quantity: line.quantity
    }));
  }

  /** @returns {number} */
  get total() {
    return this._total;
  }

  /** @returns {boolean} */
  isPlaced() {
    return this._status === OrderStatus.PLACED;
  }

  /**
   * Adds a line while the order is still a draft. The quantity is whatever
   * the cashier typed, including zero. Placing the order accepts or rejects it.
   * @param {OrderLine} line
   * @returns {Order}
   */
  addLine({barcode, name, price, quantity}) {
    if (this._status !== OrderStatus.DRAFT) {
      throw new OrderAlreadyPlacedError({id: this._id});
    }
    this._lines.push({barcode, name, price, quantity});
    this._total = this._getTotalAmount();
    return this;
  }

  /**
   * Draft to placed. Empty lines, or a quantity that is not a positive number,
   * leave the order as a draft. Placing an order that is already placed does nothing.
   * @returns {Order}
   */
  place() {
    if (this._status === OrderStatus.PLACED) {
      return this;
    }
    if (this._lines.length === 0) {
      throw new EmptyOrderLinesError();
    }
    this._lines.forEach(line => {
      const quantity = Number(line && line.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new InvalidOrderQuantityError({
          quantity: line && line.quantity,
          barcode: line && line.barcode
        });
      }
    });
    this._status = OrderStatus.PLACED;
    return this;
  }

  /**
   * @returns {number}
   * @private
   */
  _getTotalAmount() {
    return this._lines.reduce((acc, element) =>
      add(acc, multiply(element.price, element.quantity)), 0);
  }

}

/**
 * @param {OrderLine[] | null | undefined} lines
 * @returns {OrderLine[]}
 */
function copyLines(lines) {
  if (!Array.isArray(lines)) {
    return [];
  }
  return lines.map(line => ({
    barcode: line && line.barcode,
    name: line && line.name,
    price: line && line.price,
    quantity: line && line.quantity
  }));
}
