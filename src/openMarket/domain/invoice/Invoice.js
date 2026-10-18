import InvoiceStatus from './InvoiceStatus';
import InvoiceNumber from './InvoiceNumber';
import InvalidInvoiceError from './InvalidInvoiceError';
import InvoiceAlreadyCancelledError from './InvoiceAlreadyCancelledError';
import Money from '../money/Money';
import Quantity from '../money/Quantity';
import VatRate from '../tax/VatRate';
import VatBreakdown from '../tax/VatBreakdown';
import InvoiceType from './InvoiceType';
import {lineKind} from '../order/lineValidity';
/** @typedef {import('../order/Order').default} Order */

/**
 * Shop named on the invoice at the moment it was issued.
 * @typedef {object} InvoiceIssuer
 * @property {string} nif
 * @property {string} legalName
 * @property {string | null} [tradeName]
 * @property {{street?: string, postalCode?: string, city?: string, province?: string, country?: string} | null} [address]
 */

/**
 * One line stored on an invoice. `amount` is the line total in cents, copied from the order.
 * @typedef {object} InvoiceLine
 * @property {'PRODUCT' | 'FREE'} [kind]
 * @property {string} barcode
 * @property {string} name
 * @property {Money} price
 * @property {Quantity} quantity
 * @property {Money} amount
 * @property {VatRate | {kind?: string, percent?: number, cause?: string | null}} vatRate
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
   * Line amounts and the total are copied from the order. They are not calculated again.
   * @param {object} params
   * @param {string} params.id
   * @param {InvoiceNumber} params.invoiceNumber
   * @param {string} params.issuedAt Offset timestamp, or a UTC instant for a caller that has not zoned it
   * @param {string} [params.issueDate] Shop-local calendar date `YYYY-MM-DD`
   * @param {InvoiceIssuer | null} [params.issuer]
   * @param {string} [params.type]
   * @param {Order} params.order
   * @returns {Invoice}
   */
  static issue({id, invoiceNumber, issuedAt, issueDate, issuer, type, order}) {
    if (order == null || typeof order.isPlaced !== 'function' || !order.isPlaced()) {
      throw new InvalidInvoiceError({field: 'order', id: id == null ? undefined : String(id)});
    }
    const lines = issuedLines(order.lines);
    return new Invoice({
      id,
      invoiceNumber,
      issuedAt,
      issueDate,
      issuer: issuer || null,
      type: type || InvoiceType.F2,
      lines,
      orderId: order.id,
      status: InvoiceStatus.ISSUED,
      cancelledAt: null,
      total: order.total,
      breakdown: VatBreakdown.fromLines(lines)
    });
  }

  /**
   * Rebuilds an invoice that was already stored.
   * @param {object} params
   * @param {string} params.id
   * @param {InvoiceNumber} params.invoiceNumber
   * @param {string} params.issuedAt
   * @param {string} [params.issueDate]
   * @param {InvoiceIssuer | null} [params.issuer]
   * @param {string} [params.type]
   * @param {string | null} [params.correctsInvoiceId]
   * @param {InvoiceLine[]} params.lines Stored lines, including each line amount
   * @param {string | null} [params.orderId]
   * @param {string} params.status
   * @param {string | null} [params.cancelledAt]
   * @param {Money | number | string} params.total Stored invoice total
   * @param {Array<{rate: VatRate | object, base: Money | number, quota: Money | number, gross: Money | number}>} [params.breakdown] Stored per-rate breakdown
   * @returns {Invoice}
   */
  static restore({id, invoiceNumber, issuedAt, issueDate, issuer, type, lines, orderId, status, cancelledAt, total, breakdown, correctsInvoiceId}) {
    return new Invoice({
      id, invoiceNumber, issuedAt, issueDate, issuer, type, lines, orderId, status, cancelledAt, total, breakdown, correctsInvoiceId
    });
  }

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {InvoiceNumber} params.invoiceNumber
   * @param {string} params.issuedAt
   * @param {string} [params.issueDate]
   * @param {InvoiceIssuer | null} [params.issuer]
   * @param {string} [params.type]
   * @param {string | null} [params.correctsInvoiceId]
   * @param {InvoiceLine[]} params.lines
   * @param {string | null} [params.orderId]
   * @param {string} params.status
   * @param {string | null} [params.cancelledAt]
   * @param {Money | number | string} params.total
   * @param {Array<{rate: VatRate | object, base: Money | number, quota: Money | number, gross: Money | number}>} [params.breakdown]
   */
  constructor({id, invoiceNumber, issuedAt, issueDate, issuer, type, lines, orderId, status, cancelledAt, total, breakdown, correctsInvoiceId}) {
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
    this._issueDate = issueDate || String(issuedAt).slice(0, 10);
    this._type = type || InvoiceType.F2;
    /** @type {InvoiceIssuer | null} */
    this._issuer = issuer || null;
    this._correctsInvoiceId = correctsInvoiceId || null;
    this._orderId = orderId == null || String(orderId).trim() === '' ? null : String(orderId);
    this._status = status;
    this._cancelledAt = status === InvoiceStatus.CANCELLED ? String(cancelledAt) : null;
    this._lines = storedLines(lines, this._id);
    this._total = storedTotal(total, this._id);
    this._breakdown = storedBreakdown(breakdown, this._lines);
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

  /** @returns {string} */
  get issueDate() {
    return this._issueDate;
  }

  /** @returns {string} */
  get type() {
    return this._type;
  }

  /** @returns {InvoiceIssuer | null} */
  get issuer() {
    return this._issuer ? {...this._issuer, address: this._issuer.address ? {...this._issuer.address} : null} : null;
  }

  /** @returns {string | null} */
  get correctsInvoiceId() {
    return this._correctsInvoiceId;
  }

  /** @returns {InvoiceLine[]} */
  get lines() {
    return this._lines.map(line => ({
      kind: lineKind(line.kind),
      barcode: line.barcode,
      name: line.name,
      price: line.price,
      quantity: line.quantity,
      amount: line.amount,
      vatRate: line.vatRate
    }));
  }

  /**
   * Stored per-rate breakdown. Loading an invoice does not calculate it again.
   * @returns {Array<{rate: VatRate, base: Money, quota: Money, gross: Money}>}
   */
  get breakdown() {
    return this._breakdown.map(row => ({
      rate: row.rate,
      base: row.base,
      quota: row.quota,
      gross: row.gross
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

  /** @returns {Money} */
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
 * Copies the order lines. Amounts stay the ones the order already rounded.
 * @param {Array<{kind?: 'PRODUCT' | 'FREE', barcode: string, name: string, price: Money, quantity: Quantity, amount: Money, vatRate?: VatRate | object}>} lines
 * @returns {InvoiceLine[]}
 */
function issuedLines(lines) {
  if (!Array.isArray(lines)) {
    return [];
  }
  return lines.map(line => ({
    kind: lineKind(line.kind),
    barcode: line.barcode == null ? '' : String(line.barcode),
    name: line.name == null ? '' : String(line.name),
    price: Money.from(line.price),
    quantity: Quantity.from(line.quantity),
    amount: Money.from(line.amount),
    vatRate: line.vatRate == null ? VatRate.standard() : VatRate.from(line.vatRate)
  }));
}

/**
 * Copies stored lines. The amount is the stored money, not price times quantity.
 * @param {InvoiceLine[]} lines
 * @param {string} id
 * @returns {InvoiceLine[]}
 */
function storedLines(lines, id) {
  if (!Array.isArray(lines)) {
    throw new InvalidInvoiceError({field: 'lines', id});
  }
  return lines.map(line => {
    if (line == null || line.amount == null) {
      throw new InvalidInvoiceError({field: 'amount', id});
    }
    try {
      return {
        kind: lineKind(line.kind),
        barcode: line.barcode == null ? '' : String(line.barcode),
        name: line.name == null ? '' : String(line.name),
        price: Money.from(line.price == null ? 0 : line.price),
        quantity: Quantity.from(line.quantity == null ? 0 : line.quantity),
        amount: Money.from(line.amount),
        vatRate: line.vatRate == null ? VatRate.standard() : VatRate.from(line.vatRate)
      };
    } catch (error) {
      throw new InvalidInvoiceError({field: 'amount', id});
    }
  });
}

/**
 * @param {Money | number | string} total
 * @param {string} id
 * @returns {Money}
 */
/**
 * Uses the stored rows. A caller that does not pass one gets the breakdown of the lines, once.
 * @param {Array<{rate: VatRate | object, base: Money | number, quota: Money | number, gross: Money | number}> | null | undefined} breakdown
 * @param {InvoiceLine[]} lines
 * @returns {Array<{rate: VatRate, base: Money, quota: Money, gross: Money}>}
 */
function storedBreakdown(breakdown, lines) {
  if (breakdown == null) {
    return VatBreakdown.fromLines(lines);
  }
  return breakdown.map(row => ({
    rate: VatRate.from(row.rate),
    base: Money.from(row.base),
    quota: Money.from(row.quota),
    gross: Money.from(row.gross)
  }));
}

function storedTotal(total, id) {
  if (total == null) {
    throw new InvalidInvoiceError({field: 'total', id});
  }
  try {
    return Money.from(total);
  } catch (error) {
    throw new InvalidInvoiceError({field: 'total', id});
  }
}
