import moment from 'moment';
import Money from '../money/Money';
import Quantity from '../money/Quantity';
import VatRate from '../tax/VatRate';
import ErrorCode from '../error/ErrorCode';
import OrderStatus from './OrderStatus';
import EmptyOrderLinesError from './EmptyOrderLinesError';
import InvalidOrderQuantityError from './InvalidOrderQuantityError';
import InvalidOrderLineError from './InvalidOrderLineError';
import OrderAlreadyPlacedError from './OrderAlreadyPlacedError';
import {lineKind, validateLine} from './lineValidity';
import Payment from '../payment/Payment';

/**
 * One line stored on an order. Amount is the line total after one half-up rounding.
 * `kind` is PRODUCT (a catalog barcode) or FREE (an amount with no product).
 * @typedef {object} OrderLine
 * @property {'PRODUCT' | 'FREE'} [kind]
 * @property {string} barcode
 * @property {string} name
 * @property {Money} price
 * @property {Quantity} quantity
 * @property {Money} amount
 * @property {VatRate | {kind?: string, percent?: number, cause?: string | null}} vatRate
 * @property {boolean} [weighted] Whole-unit products reject a fraction. Omitted means unknown.
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
   * @param {Payment | null} [params.payment]
   * @returns {Order}
   */
  static restore({id, lines, date, payment}) {
    return new Order({id, lines, date, status: OrderStatus.PLACED, payment: payment || null});
  }

  /**
   * @param {object} [params]
   * @param {string} [params.id]
   * @param {OrderLine[]} [params.lines]
   * @param {string} [params.date]
   * @param {string} [params.status]
   * @param {Payment | null} [params.payment]
   */
  constructor({id, lines = [], date = moment().format('DD/MM/YYYY HH:mm:ss'), status = OrderStatus.DRAFT, payment = null} = {}) {
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

    /**
     * @type {Payment | null}
     * @private
     */
    this._payment = payment instanceof Payment ? payment : null;
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
    return this._lines.map(line => {
      const copy = {
        kind: lineKind(line.kind),
        barcode: line.barcode == null ? '' : line.barcode,
        name: line.name,
        price: line.price,
        quantity: line.quantity,
        amount: line.amount,
        vatRate: line.vatRate
      };
      if (typeof line.weighted !== 'boolean') {
        return copy;
      }
      return {...copy, weighted: line.weighted};
    });
  }

  /** @returns {Money} */
  get total() {
    return this._total;
  }

  /** @returns {Payment | null} */
  get payment() {
    return this._payment;
  }

  /**
   * Records how this order is paid. The change is checked against the total
   * with the same {@link Payment} the till uses.
   * @param {Payment | {method?: string, tendered?: Money | number | string, tenderedCents?: number}} payment
   * @returns {Order}
   */
  recordPayment(payment) {
    const tendered = payment instanceof Payment
      ? Money.ofCents(payment.tenderedCents)
      : (payment && payment.tendered != null
        ? payment.tendered
        : (payment && payment.tenderedCents != null ? Money.ofCents(payment.tenderedCents) : undefined));
    this._payment = Payment.settle({
      total: this._total,
      method: payment && payment.method,
      tendered
    });
    return this;
  }

  /** @returns {boolean} */
  isPlaced() {
    return this._status === OrderStatus.PLACED;
  }

  /**
   * Adds a catalog line while the order is still a draft.
   * A line that cannot be sold is refused and the order stays unchanged.
   * A free-amount line uses {@link Order#addFreeLine}.
   * @param {{kind?: 'PRODUCT' | 'FREE', barcode: string, name: string, price: Money | number | string, quantity: Quantity | number | string, vatRate?: VatRate | object, weighted?: boolean}} line
   * @returns {Order}
   */
  addLine(line) {
    this._requireDraft();
    if (line && line.kind === 'FREE') {
      throw new InvalidOrderLineError({
        barcode: line.barcode,
        reason: ErrorCode.ORDER_LINE_INVALID
      });
    }
    const check = validateLine(line);
    if (!check.valid) {
      throw new InvalidOrderLineError({
        quantity: line && line.quantity,
        barcode: line && line.barcode,
        reason: check.code
      });
    }
    this._lines.push(pricedLine({...line, kind: 'PRODUCT'}));
    this._total = this._getTotalAmount();
    return this;
  }

  /**
   * Adds an amount that is not a product. The quantity is 1 and there is no barcode.
   * The description is the line name. The amount is VAT included and must be above zero.
   * @param {{description?: string, amount?: Money | number | string, vatRate?: VatRate | object}} [line]
   * @returns {Order}
   */
  addFreeLine({description, amount, vatRate} = {}) {
    this._requireDraft();
    const name = description == null ? '' : String(description).trim();
    if (name === '') {
      throw new InvalidOrderLineError({reason: ErrorCode.ORDER_LINE_INVALID});
    }
    let money;
    try {
      money = Money.from(amount);
    } catch (error) {
      throw new InvalidOrderLineError({reason: ErrorCode.ORDER_LINE_INVALID});
    }
    const check = validateLine({kind: 'FREE', amount: money});
    if (!check.valid) {
      throw new InvalidOrderLineError({reason: check.code});
    }
    const rate = vatRate == null ? VatRate.standard() : VatRate.from(vatRate);
    this._lines.push({
      kind: 'FREE',
      barcode: '',
      name,
      price: money,
      quantity: Quantity.from(1),
      amount: money,
      vatRate: rate,
      weighted: false
    });
    this._total = this._getTotalAmount();
    return this;
  }

  /**
   * Draft to placed. Empty lines, or a line that cannot be sold,
   * leave the order as a draft. Placing an order that is already placed does nothing.
   * A quantity that is not a positive number still raises {@link InvalidOrderQuantityError}.
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
      const check = validateLine(line);
      if (!check.valid) {
        throw lineError(line, check.code);
      }
    });
    this._status = OrderStatus.PLACED;
    return this;
  }

  /**
   * @private
   */
  _requireDraft() {
    if (this._status !== OrderStatus.DRAFT) {
      throw new OrderAlreadyPlacedError({id: this._id});
    }
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
 * @param {{kind?: 'PRODUCT' | 'FREE', barcode?: string, name?: string, price?: Money | number | string, quantity?: Quantity | number | string, amount?: Money | number | string, vatRate?: VatRate | object | string, weighted?: boolean}} line
 * @returns {OrderLine}
 */
function pricedLine(line) {
  const price = Money.from(line.price == null ? 0 : line.price);
  const quantity = Quantity.from(line.quantity == null ? 0 : line.quantity);
  const amount = line.amount == null ? price.times(nonNegative(quantity)) : Money.from(line.amount);
  const kind = lineKind(line.kind);
  const priced = {
    kind,
    barcode: kind === 'FREE' || line.barcode == null ? '' : line.barcode,
    name: line.name == null ? '' : line.name,
    price,
    quantity,
    amount,
    vatRate: line.vatRate == null ? VatRate.standard() : VatRate.from(line.vatRate)
  };
  if (typeof line.weighted !== 'boolean') {
    return priced;
  }
  return {...priced, weighted: line.weighted};
}

/**
 * A quantity that is not a positive number keeps the quantity error.
 * Every other refusal is an invalid line. Placing and adding share this.
 * @param {{quantity?: *, barcode?: string} | null | undefined} line
 * @param {string} code
 * @returns {InvalidOrderQuantityError | InvalidOrderLineError}
 */
function lineError(line, code) {
  const quantity = line && line.quantity;
  const units = quantity instanceof Quantity ? quantity.units : Number(quantity);
  if (code === ErrorCode.ORDER_QUANTITY_INVALID) {
    return new InvalidOrderQuantityError({
      quantity: units,
      barcode: line && line.barcode
    });
  }
  return new InvalidOrderLineError({
    quantity: units,
    barcode: line && line.barcode,
    reason: code
  });
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
