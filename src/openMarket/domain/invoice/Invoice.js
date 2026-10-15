import InvoiceStatus from './InvoiceStatus';
import InvoiceNumber from './InvoiceNumber';
import InvalidInvoiceError from './InvalidInvoiceError';
import InvoiceAlreadyCancelledError from './InvoiceAlreadyCancelledError';
import {add, multiply} from '../money';
/** @import Order from '../order/Order' */

/**
 * One line stored on an invoice. `amount` is the line total in euros.
 * @typedef {object} InvoiceLine
 * @property {string} barcode
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 * @property {number} amount
 */

/**
 * An issued invoice. The number, the lines, the amounts, the issue time, and the total do not change.
 * Those amounts are stored when the invoice is issued. Loading them does not calculate them again.
 * Cancellation records that the document was withdrawn. It does not edit the document.
 */
export default class Invoice {

  /**
   * Issues a new invoice from a placed order. The number comes from the caller, already allocated.
   * The order's lines are copied. They are not checked again.
   * Line amounts and the total use the same cents arithmetic as the order total, and are fixed here.
   * @param {object} params
   * @param {string} params.id
   * @param {InvoiceNumber} params.invoiceNumber
   * @param {string} params.issuedAt
   * @param {Order} params.order
   * @returns {Invoice}
   */
  static issue({id, invoiceNumber, issuedAt, order}) {
    if (order == null || typeof order.isPlaced !== 'function' || !order.isPlaced()) {
      throw new InvalidInvoiceError({field: 'order', id: id == null ? undefined : String(id)});
    }
    const lines = issuedLines(order.lines);
    const total = lines.reduce((sum, line) => add(sum, line.amount), 0);
    return new Invoice({
      id,
      invoiceNumber,
      issuedAt,
      lines,
      orderId: order.id,
      status: InvoiceStatus.ISSUED,
      cancelledAt: null,
      total
    });
  }

  /**
   * Rebuilds an invoice that was already stored.
   * @param {object} params
   * @param {string} params.id
   * @param {InvoiceNumber} params.invoiceNumber
   * @param {string} params.issuedAt
   * @param {InvoiceLine[]} params.lines Stored lines, including each line amount
   * @param {string | null} [params.orderId]
   * @param {string} params.status
   * @param {string | null} [params.cancelledAt]
   * @param {number} params.total Stored invoice total
   * @returns {Invoice}
   */
  static restore({id, invoiceNumber, issuedAt, lines, orderId, status, cancelledAt, total}) {
    return new Invoice({id, invoiceNumber, issuedAt, lines, orderId, status, cancelledAt, total});
  }

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {InvoiceNumber} params.invoiceNumber
   * @param {string} params.issuedAt
   * @param {InvoiceLine[]} params.lines
   * @param {string | null} [params.orderId]
   * @param {string} params.status
   * @param {string | null} [params.cancelledAt]
   * @param {number} params.total
   */
  constructor({id, invoiceNumber, issuedAt, lines, orderId, status, cancelledAt, total}) {
    if (id == null || String(id).trim() === '') {
      throw new InvalidInvoiceError({field: 'id'});
    }
    if (!(invoiceNumber instanceof InvoiceNumber)) {
      throw new InvalidInvoiceError({field: 'invoiceNumber', id: String(id)});
    }
    if (issuedAt == null || String(issuedAt).trim() === '') {
      throw new InvalidInvoiceError({field: 'issuedAt', id: String(id)});
    }
    if (status !== InvoiceStatus.ISSUED && status !== InvoiceStatus.CANCELLED) {
      throw new InvalidInvoiceError({field: 'status', id: String(id)});
    }
    if (status === InvoiceStatus.CANCELLED && (cancelledAt == null || String(cancelledAt).trim() === '')) {
      throw new InvalidInvoiceError({field: 'cancelledAt', id: String(id)});
    }
    if (status === InvoiceStatus.ISSUED && cancelledAt != null && String(cancelledAt).trim() !== '') {
      throw new InvalidInvoiceError({field: 'cancelledAt', id: String(id)});
    }
    this._id = String(id);
    this._invoiceNumber = invoiceNumber;
    this._issuedAt = String(issuedAt);
    this._orderId = orderId == null || String(orderId).trim() === '' ? null : String(orderId);
    this._status = status;
    this._cancelledAt = status === InvoiceStatus.CANCELLED ? String(cancelledAt) : null;
    this._lines = storedLines(lines, this._id);
    if (total == null || !Number.isFinite(Number(total))) {
      throw new InvalidInvoiceError({field: 'total', id: this._id});
    }
    this._total = Number(total);
  }

  /** @returns {string} */
  get id() {
    return this._id;
  }

  /** @returns {InvoiceNumber} */
  get invoiceNumber() {
    return this._invoiceNumber;
  }

  /** @returns {string} */
  get issuedAt() {
    return this._issuedAt;
  }

  /** @returns {InvoiceLine[]} */
  get lines() {
    return this._lines.map(line => ({
      barcode: line.barcode,
      name: line.name,
      price: line.price,
      quantity: line.quantity,
      amount: line.amount
    }));
  }

  /** @returns {string | null} */
  get orderId() {
    return this._orderId;
  }

  /** @returns {string} */
  get status() {
    return this._status;
  }

  /** @returns {string | null} */
  get cancelledAt() {
    return this._cancelledAt;
  }

  /** @returns {number} */
  get total() {
    return this._total;
  }

  /**
   * Withdraws the invoice. The number, lines, issue time, and total stay.
   * @param {{cancelledAt: string}} command
   * @returns {Invoice}
   */
  cancel({cancelledAt}) {
    if (this._status === InvoiceStatus.CANCELLED) {
      throw new InvoiceAlreadyCancelledError({
        id: this._id,
        invoiceNumber: this._invoiceNumber.formatted
      });
    }
    if (cancelledAt == null || String(cancelledAt).trim() === '') {
      throw new InvalidInvoiceError({field: 'cancelledAt', id: this._id});
    }
    this._status = InvoiceStatus.CANCELLED;
    this._cancelledAt = String(cancelledAt);
    return this;
  }

}

/**
 * Line amounts for a new invoice. Same rounding as the order total.
 * @param {Array<{barcode: string, name: string, price: number, quantity: number}>} lines
 * @returns {InvoiceLine[]}
 */
function issuedLines(lines) {
  if (!Array.isArray(lines)) {
    return [];
  }
  return lines.map(line => ({
    barcode: line.barcode == null ? '' : String(line.barcode),
    name: line.name == null ? '' : String(line.name),
    price: line.price,
    quantity: line.quantity,
    amount: multiply(line.price, line.quantity)
  }));
}

/**
 * Copies stored lines. The amount is the stored number, not price times quantity.
 * @param {InvoiceLine[]} lines
 * @param {string} id
 * @returns {InvoiceLine[]}
 */
function storedLines(lines, id) {
  if (!Array.isArray(lines)) {
    throw new InvalidInvoiceError({field: 'lines', id});
  }
  return lines.map(line => {
    if (line == null || line.amount == null || !Number.isFinite(Number(line.amount))) {
      throw new InvalidInvoiceError({field: 'amount', id});
    }
    return {
      barcode: line.barcode == null ? '' : String(line.barcode),
      name: line.name == null ? '' : String(line.name),
      price: line.price,
      quantity: line.quantity,
      amount: Number(line.amount)
    };
  });
}
