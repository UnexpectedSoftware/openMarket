import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import {issuedPayload} from '../../../domain/invoice/invoicePayload';
import {coreBlocks} from '../../../domain/receipt/coreBlocks';
import {receiptBlock} from '../../../domain/receipt/ReceiptBlock';
import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import SellPreferencesQuery from '../../../domain/shop/SellPreferencesQuery';
import SellPreferencesView from '../../../domain/shop/SellPreferencesView';
import ShopProfileQuery from '../../../domain/shop/ShopProfileQuery';
import VatRate from '../../../domain/tax/VatRate';
import VatBreakdown from '../../../domain/tax/VatBreakdown';
/** @typedef {import('../../../domain/invoice/InvoiceRepository').default} InvoiceRepository */
/** @typedef {import('../../../domain/order/OrderRepository').default} OrderRepository */
/** @typedef {import('../../../domain/shop/SellPreferencesRepository').default} SellPreferencesRepository */
/** @typedef {import('../../../domain/shop/ShopProfileRepository').default} ShopProfileRepository */
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
 * @property {boolean} [weighted]
 */

/**
 * Shop names for the unsaved ticket. Not an InvoiceIssued issuer.
 * @typedef {object} PreviewIssuer
 * @property {string | null} [tradeName]
 * @property {string | null} [legalName]
 * @property {string | null} [nif]
 * @property {string | null} [phone]
 * @property {{street?: string, postalCode?: string, city?: string, province?: string, country?: string} | null} [address]
 */

/**
 * Builds the ticket for one order: fiscal slot, optional shop header, the shop's
 * blocks, optional shop footer, then the footer slot. Header and footer are
 * not part of the invoice payload. The HTML preview ignores the paper width.
 */
export default class BuildReceipt {

  /**
   * @param {object} deps
   * @param {InvoiceRepository} deps.invoiceRepository
   * @param {ReceiptSlots} deps.receiptSlots
   * @param {SellPreferencesRepository} [deps.sellPreferencesRepository]
   * @param {ShopProfileRepository} [deps.shopProfileRepository]
   * @param {OrderRepository} [deps.orderRepository]
   * @param {(error: unknown) => void} [deps.recordError]
   * @param {{render: (receipt: {blocks?: object[]}) => string}} [deps.htmlReceiptRenderer]
   * @param {{zonedNow: () => {date?: string, local?: string}}} [deps.clock]
   */
  constructor({
    invoiceRepository,
    receiptSlots,
    sellPreferencesRepository,
    shopProfileRepository,
    orderRepository,
    recordError,
    htmlReceiptRenderer,
    clock
  }) {
    this._invoiceRepository = invoiceRepository;
    this._receiptSlots = receiptSlots;
    this._sellPreferencesRepository = sellPreferencesRepository || null;
    this._shopProfileRepository = shopProfileRepository || null;
    this._orderRepository = orderRepository || null;
    this._recordError = typeof recordError === 'function' ? recordError : () => {};
    this._html = htmlReceiptRenderer || null;
    this._clock = clock || null;
  }

  /**
   * @param {{orderId: string}} query
   * @returns {Observable<{blocks: object[], html: string}>}
   */
  build({orderId}) {
    return this._preferences().flatMap(preferences =>
      this._invoiceRepository.findByOrderId({orderId: orderId == null ? '' : String(orderId)})
        .defaultIfEmpty(null)
        .flatMap(invoice => this._profile().flatMap(profile =>
          this._sale(orderId).map(detail => {
            const payload = invoice ? issuedPayload(invoice) : null;
            const receipt = withLineWeight(
              withPayment(withPhone(payload, profile), paymentOf(detail)),
              detail
            );
            return this._document(receipt, payload, preferences);
          }))));
  }

  /**
   * A ticket for a cart that is not saved yet. Plugin slots receive no invoice.
   * The shop block comes from the profile repository. A passed issuer is ignored.
   * @param {{lines?: PreviewLine[], payment?: {method?: string, tenderedCents?: number, changeCents?: number, parts?: object[] | null} | null, invoiceNumber?: string | null}} query
   * @returns {Observable<{blocks: object[], html: string}>}
   */
  preview({lines, payment, invoiceNumber}) {
    return this._preferences().flatMap(preferences =>
      this._profile().map(profile =>
        this._document(previewPayload({
          lines,
          issuer: shopIssuer(profile),
          when: this._now(),
          payment,
          invoiceNumber
        }), null, preferences)));
  }

  /**
   * @param {object | null} payload
   * @param {object | null} [slotPayload]
   * @param {SellPreferencesView} [preferences]
   * @returns {{blocks: object[], html: string}}
   */
  _document(payload, slotPayload, preferences) {
    const copy = preferences || new SellPreferencesView();
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
    const blocks = fiscal
      .concat(copyBlock(copy.headerText))
      .concat(coreBlocks(payload ? {...payload, paperWidthMm: copy.paperWidthMm} : payload))
      .concat(copyBlock(copy.footerText))
      .concat(footer);
    const html = this._html ? this._html.render({blocks}) : '';
    return {blocks, html};
  }

  /**
   * Shop-local now, for a preview that is not an invoice yet.
   * @returns {{date?: string, local?: string} | null}
   */
  _now() {
    if (!this._clock || typeof this._clock.zonedNow !== 'function') {
      return null;
    }
    return this._clock.zonedNow();
  }

  /**
   * Payment stored on the order. It is not part of the invoice payload.
   * @param {string} orderId
   * @returns {Observable<object | null>}
   */
  _sale(orderId) {
    if (!this._orderRepository || orderId == null || orderId === '') {
      return Observable.of(null);
    }
    return this._orderRepository.find({id: String(orderId)}).defaultIfEmpty(null);
  }

  /** @returns {Observable<object | null>} */
  _profile() {
    if (!this._shopProfileRepository) {
      return Observable.of(null);
    }
    return this._shopProfileRepository.find(new ShopProfileQuery()).defaultIfEmpty(null);
  }

  /** @returns {Observable<SellPreferencesView>} */
  _preferences() {
    if (!this._sellPreferencesRepository) {
      return Observable.of(new SellPreferencesView());
    }
    return this._sellPreferencesRepository.find(new SellPreferencesQuery());
  }

}

/**
 * The open shop, including the phone the invoice snapshot does not store.
 * @param {{tradeName?: string | null, legalName?: string | null, nif?: string | null, phone?: string | null, street?: string, postalCode?: string, city?: string, province?: string, country?: string} | null | undefined} profile
 * @returns {PreviewIssuer | null}
 */
function shopIssuer(profile) {
  if (!profile) {
    return null;
  }
  return {
    tradeName: profile.tradeName || null,
    legalName: profile.legalName || null,
    nif: profile.nif || null,
    phone: profile.phone || null,
    address: {
      street: profile.street || '',
      postalCode: profile.postalCode || '',
      city: profile.city || '',
      province: profile.province || '',
      country: profile.country || ''
    }
  };
}

/**
 * @param {{payment?: {method?: string, tenderedCents?: number | null, changeCents?: number | null, parts?: object[] | null}} | null | undefined} detail
 * @returns {{method: string, tenderedCents: number | null, changeCents: number | null} | null}
 */
function paymentOf(detail) {
  const payment = detail && detail.payment;
  if (!payment || !payment.method) {
    return null;
  }
  return {
    method: payment.method,
    tenderedCents: payment.tenderedCents,
    changeCents: payment.changeCents
  };
}

/**
 * Payment stays off the invoice payload the fiscal slot receives.
 * @param {object | null} payload
 * @param {{method: string, tenderedCents: number | null, changeCents: number | null} | null} payment
 * @returns {object | null}
 */
/**
 * The detail line remembers weight for rows saved before the invoice column.
 * @param {{lines?: object[]} | null} payload
 * @param {{lines?: Array<{weighted?: boolean}>} | null | undefined} detail
 * @returns {object | null}
 */
function withLineWeight(payload, detail) {
  const stored = detail && detail.lines;
  if (!payload || !stored) {
    return payload;
  }
  return {
    ...payload,
    lines: (payload.lines || []).map((line, index) => {
      const row = stored[index];
      if (!row || typeof row.weighted !== 'boolean') {
        return line;
      }
      return {...line, weighted: row.weighted};
    })
  };
}

function withPayment(payload, payment) {
  if (!payload || !payment) {
    return payload;
  }
  return {...payload, payment};
}

/**
 * Phone for a saved ticket. The stored invoice payload is left unchanged.
 * @param {{issuer?: PreviewIssuer | null} | null} payload
 * @param {{phone?: string | null} | null | undefined} profile
 * @returns {object | null}
 */
function withPhone(payload, profile) {
  const phone = profile && profile.phone ? String(profile.phone).trim() : '';
  if (!payload || phone === '') {
    return payload;
  }
  const issuer = payload.issuer ? {...payload.issuer, phone} : {
    tradeName: null,
    legalName: null,
    nif: null,
    phone,
    address: null
  };
  return {...payload, issuer};
}

/**
 * A non-empty shop line around the core blocks. Blank copy adds nothing.
 * @param {string | null | undefined} text
 * @returns {object[]}
 */
function copyBlock(text) {
  const value = text == null ? '' : String(text).trim();
  if (value === '') {
    return [];
  }
  return [receiptBlock({type: 'text', text: value})];
}

/**
 * Shop blocks for the open cart. This is not an InvoiceIssued payload.
 * @param {{lines?: PreviewLine[], issuer?: PreviewIssuer | null, when?: {date?: string, local?: string} | null, payment?: object | null, invoiceNumber?: string | null}} query
 * @returns {object}
 */
function previewPayload({lines, issuer, when, payment, invoiceNumber}) {
  const priced = (lines || []).map(line => ({
    name: line && line.name != null ? String(line.name) : '',
    quantity: line && line.quantity,
    unitPrice: line && (line.unitPrice != null ? line.unitPrice : line.price),
    amount: lineAmount(line),
    vatRate: line && line.vatRate != null ? VatRate.from(line.vatRate) : VatRate.standard(),
    weighted: !!(line && line.weighted)
  }));
  const breakdown = VatBreakdown.fromLines(priced.map(line => ({
    amount: line.amount,
    vatRate: line.vatRate
  })));
  const total = priced.reduce((sum, line) => sum.plus(line.amount), Money.ofCents(0));
  return {
    issuer: issuer ? {
      tradeName: issuer.tradeName || null,
      legalName: issuer.legalName || null,
      nif: issuer.nif || null,
      phone: issuer.phone || null,
      address: issuer.address || null
    } : null,
    invoiceNumber: invoiceNumber ? String(invoiceNumber) : null,
    issueDate: when && when.date ? when.date : '',
    issuedAt: when && when.local ? when.local : '',
    lines: priced.map(line => ({
      name: line.name,
      quantityMilli: quantityMilli(line.quantity),
      weighted: !!(line && line.weighted),
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
    totalCents: total.cents,
    payment: payment || null
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
