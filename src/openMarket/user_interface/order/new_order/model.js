import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import VatRate from '../../../domain/tax/VatRate';
import VatBreakdown from '../../../domain/tax/VatBreakdown';
import {validateLine} from '../../../domain/order/lineValidity';

/**
 * Cart draft. Lines hold the same value objects Order uses.
 * The total is cents. Formatting happens at render.
 * @returns {{order: {lines: object[], total: Money}, readonly: boolean, lowStockBarcodes: string[], lastOrder: object | null, tiles: object[], tilesStatus: string}}
 */
export const state = () => ({
  order: {
    lines: [],
    total: Money.ofCents(0)
  },
  readonly: false,
  lowStockBarcodes: [],
  lastOrder: null,
  tiles: [],
  tilesStatus: 'idle',
  saving: false,
  previewHtml: '',
  reprintHtml: ''
});

/**
 * @param {object[] | null | undefined} lines
 * @returns {Money}
 */
export function cartTotal(lines) {
  return (lines || []).reduce((sum, line) => sum.plus(lineAmount(line)), Money.ofCents(0));
}

/**
 * @param {object | null | undefined} line
 * @returns {Money}
 */
export function lineAmount(line) {
  if (!line) {
    return Money.ofCents(0);
  }
  try {
    const price = moneyOrZero(line.unitPrice != null ? line.unitPrice : line.price);
    if (line.kind === 'FREE') {
      return price;
    }
    const quantity = quantityOrNull(line.quantity);
    if (!quantity || quantity.milli <= 0) {
      return Money.ofCents(0);
    }
    return price.times(quantity);
  } catch (error) {
    return Money.ofCents(0);
  }
}

/**
 * @param {object | null | undefined} line
 * @returns {boolean}
 */
export function lineIsValid(line) {
  if (!line) {
    return false;
  }
  return validateLine({
    kind: line.kind,
    quantity: line.quantity,
    amount: line.kind === 'FREE' ? (line.unitPrice != null ? line.unitPrice : line.price) : undefined,
    weighted: line.weighted
  }).valid;
}

/**
 * VAT rows in cents, one half-up rounding per rate. Same breakdown as the invoice.
 * @param {object[] | null | undefined} lines
 * @returns {Array<{label: string, baseCents: number, quotaCents: number}>}
 */
export function vatRows(lines) {
  return VatBreakdown.fromLines((lines || []).map(line => ({
    amount: lineAmount(line),
    vatRate: line.vatRate || VatRate.standard()
  }))).map(row => ({
    label: rateLabel(row.rate),
    baseCents: row.base.cents,
    quotaCents: row.quota.cents
  }));
}

/**
 * @param {{lines: object[], product: object, quantity: *, lowStockBarcodes?: string[], replace?: boolean}} command
 */
export const addProduct = ({lines, product, quantity, lowStockBarcodes, replace}) => {
  const source = (lines || []).map(asLine);
  const barcode = product && product.barcode != null ? String(product.barcode) : '';
  const existing = source.find(line => line.kind !== 'FREE' && line.barcode === barcode);
  const kept = source.filter(line => line.kind === 'FREE' || line.barcode !== barcode);
  let nextQuantity = quantityOrNull(quantity) || Quantity.from(1);
  if (existing && !replace) {
    nextQuantity = existing.quantity.plus(nextQuantity);
  }
  const weighted = weightedOf(product);
  kept.push({
    kind: 'PRODUCT',
    barcode,
    name: product && product.name != null ? String(product.name) : '',
    unitPrice: moneyOrZero(product && product.price),
    quantity: nextQuantity,
    vatRate: rateOf(product && product.vatRate),
    weighted: weighted == null && existing ? existing.weighted : weighted,
    lowStock: isLow(product)
      || (lowStockBarcodes || []).indexOf(barcode) !== -1
      || !!(existing && existing.lowStock)
  });
  return pack(kept, false);
};

/**
 * @param {{lines: object[], description: string, amount: *, vatRate?: *}} command
 */
export const addFreeLine = ({lines, description, amount, vatRate}) => {
  const source = (lines || []).map(asLine);
  const name = description == null ? '' : String(description).trim();
  source.push({
    kind: 'FREE',
    barcode: '',
    name: name || 'Venta libre',
    unitPrice: moneyOrZero(amount),
    quantity: Quantity.from(1),
    vatRate: rateOf(vatRate),
    weighted: false,
    lowStock: false
  });
  return pack(source, false);
};

/**
 * A blank or non-numeric quantity leaves the line as it was.
 * Zero is stored so the row can be flagged.
 * @param {{lines: object[], barcode: string, quantity: *}} command
 */
export const updateQuantity = ({lines, barcode, quantity}) => {
  const next = (lines || []).map(current => {
    const line = asLine(current);
    if (line.kind === 'FREE' || line.barcode !== barcode) {
      return line;
    }
    const parsed = quantityOrNull(quantity);
    if (!parsed) {
      return line;
    }
    return {...line, quantity: parsed};
  });
  return pack(next, false);
};

/**
 * @param {{lines: object[], barcode?: string, index?: number}} command
 */
export const removeProduct = ({lines, barcode, index}) => {
  const source = (lines || []).map(asLine);
  const next = typeof index === 'number'
    ? source.filter((line, position) => position !== index)
    : source.filter(line => line.kind === 'FREE' || line.barcode !== barcode);
  return pack(next, false);
};

/**
 * @param {{order: {id?: string, createdAt?: string, lines: object[]}}} command
 */
export const loadOrder = ({order}) => {
  const lines = ((order && order.lines) || []).map(line => asLine({
    kind: line.kind,
    barcode: line.barcode,
    name: line.name,
    unitPrice: line.price != null ? line.price : line.unitPrice,
    quantity: line.quantity,
    vatRate: line.vatRate || line.vat,
    weighted: line.weighted,
    lowStock: line.lowStock
  }));
  return pack(lines, true, {createdAt: order && order.createdAt, id: order && order.id});
};

/**
 * @param {object | null | undefined} line
 * @returns {object}
 */
export function asLine(line) {
  const kind = line && line.kind === 'FREE' ? 'FREE' : 'PRODUCT';
  const vatSource = line && (line.vatRate != null ? line.vatRate : line.vat);
  const quantity = kind === 'FREE'
    ? Quantity.from(1)
    : (quantityOrNull(line && line.quantity) || Quantity.ofMilli(0));
  return {
    kind,
    barcode: kind === 'FREE' ? '' : (line && line.barcode != null ? String(line.barcode) : ''),
    name: line && line.name != null ? String(line.name) : '',
    unitPrice: moneyOrZero(line && (line.unitPrice != null ? line.unitPrice : line.price)),
    quantity,
    vatRate: rateOf(vatSource),
    weighted: line && typeof line.weighted === 'boolean' ? line.weighted : undefined,
    lowStock: !!(line && line.lowStock)
  };
}

/**
 * @param {object[]} lines
 * @param {boolean} readonly
 * @param {{createdAt?: string, id?: string}} [extra]
 */
function pack(lines, readonly, extra) {
  const order = {
    lines,
    total: cartTotal(lines)
  };
  if (extra && extra.createdAt) {
    order.createdAt = extra.createdAt;
  }
  if (extra && extra.id) {
    order.id = extra.id;
  }
  return {
    order,
    readonly: !!readonly
  };
}

/**
 * @param {*} value
 * @returns {Money}
 */
function moneyOrZero(value) {
  if (value == null || value === '') {
    return Money.ofCents(0);
  }
  try {
    return Money.from(value);
  } catch (error) {
    return Money.ofCents(0);
  }
}

/**
 * @param {*} value
 * @returns {Quantity | null}
 */
function quantityOrNull(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'number' && !isFinite(value)) {
    return null;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (text === '' || !isFinite(Number(text))) {
      return null;
    }
  }
  try {
    return Quantity.from(value);
  } catch (error) {
    return null;
  }
}

/**
 * @param {*} rate
 * @returns {VatRate}
 */
function rateOf(rate) {
  if (rate == null || rate === '') {
    return VatRate.standard();
  }
  try {
    return VatRate.from(rate);
  } catch (error) {
    return VatRate.standard();
  }
}

/**
 * @param {object | null | undefined} product
 * @returns {boolean | undefined}
 */
function weightedOf(product) {
  if (!product) {
    return undefined;
  }
  const value = typeof product.isWeighted === 'function' ? product.isWeighted() : product.isWeighted;
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * @param {object | null | undefined} product
 * @returns {boolean}
 */
function isLow(product) {
  if (!product) {
    return false;
  }
  if (typeof product.isStockLow === 'function') {
    return !!product.isStockLow();
  }
  if (product.stock != null && product.stockMin != null) {
    return Number(product.stock) <= Number(product.stockMin);
  }
  return false;
}

/**
 * @param {{kind: string, percent: number, cause: string | null}} rate
 * @returns {string}
 */
function rateLabel(rate) {
  if (rate.kind === 'E') {
    return 'Exento ' + rate.cause;
  }
  if (rate.kind === 'N') {
    return 'No sujeto ' + rate.cause;
  }
  return rate.percent + ' %';
}
