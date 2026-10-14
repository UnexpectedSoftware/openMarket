import InvoiceStatus from './InvoiceStatus';
import InvoiceNumber from './InvoiceNumber';
import EmptyInvoiceLinesError from './EmptyInvoiceLinesError';
import InvalidInvoiceLineError from './InvalidInvoiceLineError';
import InvalidInvoiceError from './InvalidInvoiceError';
import InvoiceAlreadyCancelledError from './InvoiceAlreadyCancelledError';

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
 * An issued invoice. The number, the lines, the issue time, and the total do not change.
 * Cancellation records that the document was withdrawn. It does not edit the document.
 */
export default class Invoice {

  /**
   * Issues a new invoice. The number comes from the caller, already allocated.
   * @param {object} params
   * @param {string} params.id
   * @param {InvoiceNumber} params.invoiceNumber
   * @param {string} params.issuedAt
   * @param {Array<{barcode: string, name: string, price: number, quantity: number}>} params.lines
   * @param {string | null} [params.orderId]
   * @returns {Invoice}
   */
  static issue({id, invoiceNumber, issuedAt, lines, orderId}) {
    return new Invoice({
      id,
      invoiceNumber,
      issuedAt,
      lines,
      orderId,
      status: InvoiceStatus.ISSUED,
      cancelledAt: null
    });
  }

  /**
   * Rebuilds an invoice that was already stored.
   * @param {object} params
   * @param {string} params.id
   * @param {InvoiceNumber} params.invoiceNumber
   * @param {string} params.issuedAt
   * @param {Array<{barcode: string, name: string, price: number, quantity: number}>} params.lines
   * @param {string | null} [params.orderId]
   * @param {string} params.status
   * @param {string | null} [params.cancelledAt]
   * @param {number} params.total
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
   * @param {Array<{barcode: string, name: string, price: number, quantity: number}>} params.lines
   * @param {string | null} [params.orderId]
   * @param {string} params.status
   * @param {string | null} [params.cancelledAt]
   * @param {number} [params.total]
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
    this._lines = copyLines(lines);
    const computed = this._lines.reduce((sum, line) => addCents(sum, line.amount), 0);
    this._total = total == null ? computed : cents(total);
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
 * @param {Array<{barcode: string, name: string, price: number, quantity: number}>} lines
 * @returns {InvoiceLine[]}
 */
function copyLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new EmptyInvoiceLinesError();
  }
  return lines.map(line => {
    if (line == null || typeof line !== 'object') {
      throw new InvalidInvoiceLineError({problem: 'line'});
    }
    const barcode = line.barcode == null ? '' : String(line.barcode).trim();
    const name = line.name == null ? '' : String(line.name).trim();
    if (barcode === '' || name === '') {
      throw new InvalidInvoiceLineError({barcode, problem: 'line'});
    }
    const quantity = Number(line.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new InvalidInvoiceLineError({barcode, quantity: line.quantity, problem: 'quantity'});
    }
    const price = Number(line.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new InvalidInvoiceLineError({barcode, price: line.price, problem: 'price'});
    }
    return {
      barcode,
      name,
      price,
      quantity,
      amount: cents(price * quantity)
    };
  });
}

/**
 * Rounds a money amount to cents.
 * @param {number} value
 * @returns {number}
 */
function cents(value) {
  return Number(Number(value).toFixed(2));
}

/**
 * @param {number} left
 * @param {number} right
 * @returns {number}
 */
function addCents(left, right) {
  return cents(Number(left) + Number(right));
}
