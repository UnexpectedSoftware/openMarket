import moment from 'moment';
import Money from '../money/Money';
import Quantity from '../money/Quantity';
import VatRate from '../tax/VatRate';
import OrderStatus from './OrderStatus';
import EmptyOrderLinesError from './EmptyOrderLinesError';
import InvalidOrderQuantityError from './InvalidOrderQuantityError';
import OrderAlreadyPlacedError from './OrderAlreadyPlacedError';

/**
 * One line stored on an order. Amount is the line total after one half-up rounding.
 * @typedef {object} OrderLine
 * @property {string} barcode
 * @property {string} name
 * @property {Money} price
 * @property {Quantity} quantity
 * @property {Money} amount
 * @property {VatRate | {kind?: string, percent?: number, cause?: string | null}} vatRate
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
     * @type {Money}
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
      quantity: line.quantity,
      amount: line.amount,
      vatRate: line.vatRate
    }));
  }

  /** @returns {Money} */
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
   * @param {{barcode: string, name: string, price: Money | number | string, quantity: Quantity | number | string, vatRate?: VatRate | object}} line
   * @returns {Order}
   */
  addLine({barcode, name, price, quantity, vatRate}) {
    if (this._status !== OrderStatus.DRAFT) {
      throw new OrderAlreadyPlacedError({id: this._id});
    }
    this._lines.push(pricedLine({barcode, name, price, quantity, vatRate}));
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
      const quantity = line && line.quantity;
      const units = quantity instanceof Quantity ? quantity.units : Number(quantity);
      if (!(quantity instanceof Quantity) || quantity.milli <= 0) {
        throw new InvalidOrderQuantityError({
          quantity: units,
          barcode: line && line.barcode
        });
      }
    });
    this._status = OrderStatus.PLACED;
    return this;
  }

  /**
   * @returns {Money}
   * @private
   */
  _getTotalAmount() {
    return this._lines.reduce((acc, element) => acc.plus(element.amount), Money.ofCents(0));
  }

}

/**
 * @param {Array<{barcode: string, name: string, price: Money | number | string, quantity: Quantity | number | string, amount?: Money}> | null | undefined} lines
 * @returns {OrderLine[]}
 */
function copyLines(lines) {
  if (!Array.isArray(lines)) {
    return [];
  }
  return lines.map(line => pricedLine(line || {}));
}

/**
 * Price and quantity become value objects. A stored amount is kept.
 * A missing amount is the one half-up product of price and quantity.
 * @param {{barcode?: string, name?: string, price?: Money | number | string, quantity?: Quantity | number | string, amount?: Money | number | string, vatRate?: VatRate | object | string}} line
 * @returns {OrderLine}
 */
function pricedLine(line) {
  const price = Money.from(line.price == null ? 0 : line.price);
  const quantity = Quantity.from(line.quantity == null ? 0 : line.quantity);
  const amount = line.amount == null ? price.times(nonNegative(quantity)) : Money.from(line.amount);
  return {
    barcode: line.barcode,
    name: line.name,
    price,
    quantity,
    amount,
    vatRate: line.vatRate == null ? VatRate.standard() : VatRate.from(line.vatRate)
  };
}

/**
 * A negative quantity is stored so placing the order can reject it.
 * The line amount of a negative quantity is zero until that check runs.
 * @param {Quantity} quantity
 * @returns {Quantity}
 */
function nonNegative(quantity) {
  return quantity.milli < 0 ? Quantity.ofMilli(0) : quantity;
}
