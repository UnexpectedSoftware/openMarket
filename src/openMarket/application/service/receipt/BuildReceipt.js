import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/map';
import {issuedPayload} from '../../../domain/invoice/invoicePayload';
import {coreBlocks} from '../../../domain/receipt/coreBlocks';
import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import VatRate from '../../../domain/tax/VatRate';
import VatBreakdown from '../../../domain/tax/VatBreakdown';
/** @typedef {import('../../../domain/invoice/InvoiceRepository').default} InvoiceRepository */
/** @typedef {import('../../../infrastructure/receipt/ReceiptSlots').default} ReceiptSlots */

/**
 * A cart line the payment sheet can preview. This is not an invoice line.
 * @typedef {object} PreviewLine
 * @property {string} [name]
 * @property {*} [quantity]
 * @property {*} [unitPrice]
 * @property {*} [price]
 * @property {*} [amount]
 * @property {*} [vatRate]
 * @property {string} [kind]
 */

/**
 * Shop names for the unsaved ticket. Not an InvoiceIssued issuer.
 * @typedef {object} PreviewIssuer
 * @property {string | null} [tradeName]
 * @property {string | null} [legalName]
 * @property {string | null} [nif]
 */

/**
 * Builds the ticket for one order: fiscal slot, the shop's blocks, then the footer slot.
 */
export default class BuildReceipt {

  /**
   * @param {object} deps
   * @param {InvoiceRepository} deps.invoiceRepository
   * @param {ReceiptSlots} deps.receiptSlots
   * @param {(error: unknown) => void} [deps.recordError]
   * @param {{render: (receipt: {blocks?: object[]}) => string}} [deps.htmlReceiptRenderer]
   */
  constructor({invoiceRepository, receiptSlots, recordError, htmlReceiptRenderer}) {
    this._invoiceRepository = invoiceRepository;
    this._receiptSlots = receiptSlots;
    this._recordError = typeof recordError === 'function' ? recordError : () => {};
    this._html = htmlReceiptRenderer || null;
  }

  /**
   * @param {{orderId: string}} query
   * @returns {Observable<{blocks: object[], html: string}>}
   */
  build({orderId}) {
    return this._invoiceRepository.findByOrderId({orderId: orderId == null ? '' : String(orderId)})
      .defaultIfEmpty(null)
      .map(invoice => {
        const payload = invoice ? issuedPayload(invoice) : null;
        return this._document(payload);
      });
  }

  /**
   * A ticket for a cart that is not saved yet. Plugin slots receive no invoice.
   * @param {{lines?: PreviewLine[], issuer?: PreviewIssuer | null}} query
   * @returns {Observable<{blocks: object[], html: string}>}
   */
  preview({lines, issuer}) {
    return Observable.of(this._document(previewPayload({lines, issuer}), null));
  }

  /**
   * @param {object | null} payload
   * @param {object | null} [slotPayload]
   * @returns {{blocks: object[], html: string}}
   */
  _document(payload, slotPayload) {
    const slots = slotPayload === undefined ? payload : slotPayload;
    const fiscal = this._receiptSlots.blocks({
      slot: 'receipt.header.fiscal',
      payload: slots,
      recordError: this._recordError
    });
    const footer = this._receiptSlots.blocks({
      slot: 'receipt.footer',
      payload: slots,
      recordError: this._recordError
    });
    const blocks = fiscal.concat(coreBlocks(payload), footer);
    const html = this._html ? this._html.render({blocks}) : '';
    return {blocks, html};
  }

}

/**
 * Shop blocks for the open cart. This is not an InvoiceIssued payload.
 * @param {{lines?: PreviewLine[], issuer?: PreviewIssuer | null}} query
 * @returns {object}
 */
function previewPayload({lines, issuer}) {
  const priced = (lines || []).map(line => ({
    name: line && line.name != null ? String(line.name) : '',
    quantity: line && line.quantity,
    unitPrice: line && (line.unitPrice != null ? line.unitPrice : line.price),
    amount: lineAmount(line),
    vatRate: line && line.vatRate != null ? VatRate.from(line.vatRate) : VatRate.standard()
  }));
  const breakdown = VatBreakdown.fromLines(priced.map(line => ({
    amount: line.amount,
    vatRate: line.vatRate
  })));
  const total = priced.reduce((sum, line) => sum.plus(line.amount), Money.ofCents(0));
  return {
    issuer: issuer && (issuer.tradeName || issuer.legalName || issuer.nif) ? {
      tradeName: issuer.tradeName || null,
      legalName: issuer.legalName || null,
      nif: issuer.nif || null
    } : null,
    invoiceNumber: null,
    issueDate: '',
    issuedAt: '',
    lines: priced.map(line => ({
      name: line.name,
      quantityMilli: quantityMilli(line.quantity),
      unitPriceCents: moneyCents(line.unitPrice),
      amountCents: line.amount.cents
    })),
    vatBreakdown: breakdown.map(row => ({
      kind: row.rate.kind,
      percent: Number(row.rate.percent),
      cause: row.rate.cause == null ? null : row.rate.cause,
      baseCents: row.base.cents,
      quotaCents: row.quota.cents,
      grossCents: row.gross.cents
    })),
    totalCents: total.cents
  };
}

/**
 * @param {PreviewLine | null | undefined} line
 * @returns {Money}
 */
function lineAmount(line) {
  if (!line) {
    return Money.ofCents(0);
  }
  if (line.amount != null) {
    return Money.from(line.amount);
  }
  const price = Money.from(line.unitPrice != null ? line.unitPrice : (line.price == null ? 0 : line.price));
  if (line.kind === 'FREE') {
    return price;
  }
  const quantity = line.quantity == null ? Quantity.ofMilli(0) : Quantity.from(line.quantity);
  if (quantity.milli <= 0) {
    return Money.ofCents(0);
  }
  return price.times(quantity);
}

/**
 * @param {*} quantity
 * @returns {number}
 */
function quantityMilli(quantity) {
  if (quantity == null) {
    return 0;
  }
  return Quantity.from(quantity).milli;
}

/**
 * @param {*} value
 * @returns {number}
 */
function moneyCents(value) {
  if (value == null) {
    return 0;
  }
  return Money.from(value).cents;
}
