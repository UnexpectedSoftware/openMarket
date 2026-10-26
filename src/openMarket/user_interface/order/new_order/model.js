import Money from '../../../domain/money/Money';
import Quantity from '../../../domain/money/Quantity';
import VatRate from '../../../domain/tax/VatRate';
import VatBreakdown from '../../../domain/tax/VatBreakdown';
import {validateLine} from '../../../domain/order/lineValidity';

/**
 * Cart draft. Lines hold the same value objects Order uses.
 * The total is cents. Formatting happens at render.
 * @returns {{order: {lines: object[], total: Money}, lowStockBarcodes: string[], lastOrder: object | null, tiles: object[], tilesStatus: string, categories: object[], categoryId: string | null}}
 */
export const state = () => ({
  order: {
    lines: [],
    total: Money.ofCents(0)
  },
  lowStockBarcodes: [],
  lastOrder: null,
  tiles: [],
  tilesStatus: 'idle',
  categories: [],
  categoryId: null,
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
  const onHand = finiteStock(product && product.stock);
  kept.push({
    kind: 'PRODUCT',
    barcode,
    name: product && product.name != null ? String(product.name) : '',
    unitPrice: moneyOrZero(product && product.price),
    quantity: nextQuantity,
    vatRate: rateOf(product && product.vatRate),
    weighted: weighted == null && existing ? existing.weighted : weighted,
    stock: onHand != null ? onHand : finiteStock(existing && existing.stock),
    lowStock: isLow(product)
      || (lowStockBarcodes || []).indexOf(barcode) !== -1
      || !!(existing && existing.lowStock)
  });
  return pack(kept);
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
    stock: null,
    lowStock: false
  });
  return pack(source);
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
  return pack(next);
};

/**
 * @param {{lines: object[], barcode?: string, index?: number}} command
 */
export const removeProduct = ({lines, barcode, index}) => {
  const source = (lines || []).map(asLine);
  const next = typeof index === 'number'
    ? source.filter((line, position) => position !== index)
    : source.filter(line => line.kind === 'FREE' || line.barcode !== barcode);
  return pack(next);
};

/**
 * Drops every line after the cashier confirms emptying the ticket.
 * @returns {{order: {lines: object[], total: Money}}}
 */
export function clearLines() {
  return pack([]);
}

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
    stock: finiteStock(line && line.stock),
    lowStock: !!(line && line.lowStock)
  };
}

/**
 * Remembers a product a sale left at or below its minimum and stamps the
 * remaining stock onto the matching tile and cart line.
 * A repeat of the same barcode and stock returns the same state.
 * @param {object} current
 * @param {{barcode?: string, stock?: number, weighted?: boolean} | null | undefined} note
 * @returns {object}
 */
export function applyLowStock(current, note) {
  const barcode = note && note.barcode ? String(note.barcode) : '';
  if (!barcode) {
    return current;
  }
  const stock = finiteStock(note.stock);
  if (alreadyNoted(current, barcode, stock, note.weighted)) {
    return current;
  }
  const known = current.lowStockBarcodes || [];
  return {
    ...current,
    lowStockBarcodes: known.indexOf(barcode) === -1 ? known.concat(barcode) : known,
    tiles: markTiles(current.tiles, barcode, stock, note.weighted),
    order: markOrder(current.order, barcode, stock)
  };
}

/**
 * @param {object} current
 * @param {string} barcode
 * @param {number | null} stock
 * @param {boolean | undefined} weighted
 * @returns {boolean}
 */
function alreadyNoted(current, barcode, stock, weighted) {
  const known = current.lowStockBarcodes || [];
  if (known.indexOf(barcode) === -1) {
    return false;
  }
  const tiles = current.tiles || [];
  for (let index = 0; index < tiles.length; index += 1) {
    const tile = tiles[index];
    if (tile && tile.barcode === barcode && !sameTile(tile, stock, weighted)) {
      return false;
    }
  }
  const lines = (current.order && current.order.lines) || [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line && line.kind !== 'FREE' && line.barcode === barcode && !sameLow(line, stock)) {
      return false;
    }
  }
  return true;
}

/**
 * @param {object} item
 * @param {number | null} stock
 * @returns {boolean}
 */
function sameLow(item, stock) {
  return !!item.lowStock && finiteStock(item.stock) === stock;
}

/**
 * @param {object} tile
 * @param {number | null} stock
 * @param {boolean | undefined} weighted
 * @returns {boolean}
 */
function sameTile(tile, stock, weighted) {
  const nextWeighted = typeof weighted === 'boolean' ? weighted : !!tile.weighted;
  return sameLow(tile, stock) && !!tile.weighted === nextWeighted;
}

/**
 * @param {object[] | null | undefined} tiles
 * @param {string} barcode
 * @param {number | null} stock
 * @param {boolean | undefined} weighted
 * @returns {object[]}
 */
function markTiles(tiles, barcode, stock, weighted) {
  const source = tiles || [];
  let changed = false;
  const next = source.map(tile => {
    if (!tile || tile.barcode !== barcode || sameTile(tile, stock, weighted)) {
      return tile;
    }
    changed = true;
    const nextWeighted = typeof weighted === 'boolean' ? weighted : !!tile.weighted;
    return {...tile, lowStock: true, stock, weighted: nextWeighted};
  });
  return changed ? next : source;
}

/**
 * @param {object | null | undefined} order
 * @param {string} barcode
 * @param {number | null} stock
 * @returns {object | null | undefined}
 */
function markOrder(order, barcode, stock) {
  const lines = (order && order.lines) || [];
  let changed = false;
  const next = lines.map(line => {
    if (!line || line.kind === 'FREE' || line.barcode !== barcode || sameLow(line, stock)) {
      return line;
    }
    changed = true;
    return {...line, lowStock: true, stock};
  });
  if (!changed || !order) {
    return order;
  }
  return {...order, lines: next};
}

/**
 * @param {*} value
 * @returns {number | null}
 */
function finiteStock(value) {
  if (value == null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * @param {object[]} lines
 */
function pack(lines) {
  return {
    order: {
      lines,
      total: cartTotal(lines)
    }
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
  return weighedFlag(value);
}

/**
 * SQLite stores the column as 0 or 1. The product getter returns that number.
 * @param {*} value
 * @returns {boolean | undefined}
 */
function weighedFlag(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 1 || value === 0) {
    return value === 1;
  }
  return undefined;
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
 * Counts and VAT totals for the ticket footer. Money stays in cents.
 * A weighed line and a free line each count as one article.
 * @param {object[] | null | undefined} lines
 * @returns {{lineCount: number, articleCount: number, baseCents: number, quotaCents: number, rates: string[]}}
 */
export function ticketFacts(lines) {
  const source = lines || [];
  const rows = vatRows(source);
  return {
    lineCount: source.length,
    articleCount: source.reduce((sum, line) => sum + articleUnits(line), 0),
    baseCents: rows.reduce((sum, row) => sum + row.baseCents, 0),
    quotaCents: rows.reduce((sum, row) => sum + row.quotaCents, 0),
    rates: rows.map(row => row.label)
  };
}

/**
 * @param {object | null | undefined} line
 * @returns {number}
 */
function articleUnits(line) {
  if (!line) {
    return 0;
  }
  if (line.kind === 'FREE' || line.weighted) {
    return 1;
  }
  const milli = line.quantity && line.quantity.milli;
  if (!Number.isInteger(milli) || milli <= 0 || milli % 1000 !== 0) {
    return 0;
  }
  return milli / 1000;
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
