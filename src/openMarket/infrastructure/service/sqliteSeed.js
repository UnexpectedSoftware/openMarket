import { toStoredBound } from './sqliteDates';
import {dropInvoiceGuards, installInvoiceGuards} from './SqliteConnection';
import issuerSnapshot from '../../domain/shop/issuerSnapshot';
import Money from '../../domain/money/Money';
import Quantity from '../../domain/money/Quantity';
import VatBreakdown from '../../domain/tax/VatBreakdown';
import {centsOf, eurosOf, milliOf, unitsOf} from './storedMoney';

const UPSERT_SEQUENCE_SQL = 'INSERT INTO invoice_sequence (series, last_number) VALUES (?, ?) ' +
  'ON CONFLICT(series) DO UPDATE SET last_number = MAX(invoice_sequence.last_number, excluded.last_number)';

function allocateId(id, used) {
  const base = id == null ? 'order' : String(id);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let suffix = 2;
  let next = base + '#' + suffix;
  while (used.has(next)) {
    suffix += 1;
    next = base + '#' + suffix;
  }
  used.add(next);
  return next;
}

function lineAmountCents(line) {
  if (line.amount != null) {
    return centsOf(line.amount);
  }
  const price = Money.from(line.price == null ? 0 : line.price);
  const quantity = Quantity.from(line.quantity == null ? 0 : line.quantity);
  const safe = quantity.milli < 0 ? Quantity.ofMilli(0) : quantity;
  return price.times(safe).cents;
}

function bit(value) {
  if (value == null) {
    return null;
  }
  return value ? 1 : 0;
}

/**
 * @param {{vatPercent?: number | null, vatKind?: string | null, vatCause?: string | null}} line
 * @returns {{percent: number, kind: string, cause: string | null}}
 */
function vatOf(line) {
  const percent = line.vatPercent == null ? 21 : Number(line.vatPercent);
  const kind = line.vatKind == null || line.vatKind === '' ? 'S1' : String(line.vatKind);
  const cause = line.vatCause == null || line.vatCause === '' ? null : String(line.vatCause);
  return {percent, kind, cause};
}

/**
 * @param {{method?: string | null, tenderedCents?: number | null, changeCents?: number | null, parts?: object[] | null} | null | undefined} payment
 * @returns {Array<string | number | null>}
 */
function paymentValues(payment) {
  if (!payment) {
    return [null, null, null, null];
  }
  return [
    payment.method == null ? null : String(payment.method),
    payment.tenderedCents == null ? null : payment.tenderedCents,
    payment.changeCents == null ? null : payment.changeCents,
    payment.parts ? JSON.stringify(payment.parts) : null
  ];
}

/**
 * @param {number} cents
 * @returns {number}
 */
function eurosFromCents(cents) {
  return Money.ofCents(cents).toEuros();
}

/**
 * @typedef {object} Runnable
 * @property {(...values: any[]) => unknown} run
 */

/**
 * @typedef {object} SeedLine
 * @property {string} [barcode]
 * @property {string} [name]
 * @property {number | string | null} [price]
 * @property {number | string | null} [quantity]
 * @property {number | string} [amount]
 * @property {number | null} [vatPercent]
 * @property {string | null} [vatKind]
 * @property {string | null} [vatCause]
 * @property {boolean | null} [weighted]
 */

/**
 * @typedef {object} SeedProduct
 * @property {string} _barcode
 * @property {string | null} [_name]
 * @property {string | null} [_description]
 * @property {number | string | null} [_price]
 * @property {number | string | null} [_basePrice]
 * @property {number | null} [_stock]
 * @property {number | null} [_stockMin]
 * @property {string | null} [_status]
 * @property {boolean | null} [_weighted]
 * @property {string | null} [_categoryId]
 * @property {number | null} [_vatPercent]
 * @property {string | null} [_vatKind]
 * @property {string | null} [_vatCause]
 * @property {string | null} [_imageName]
 */

/**
 * @typedef {object} SeedOrder
 * @property {string | null} [_id]
 * @property {string} _createdAt
 * @property {number | string} _total
 * @property {SeedLine[]} [_lines]
 * @property {{method?: string | null, tenderedCents?: number | null, changeCents?: number | null, parts?: object[] | null} | null} [_payment]
 * @property {{series: string, number: number, invoiceNumber: string} | null} [_invoice]
 */

/**
 * @typedef {object} SeedStatements
 * @property {Runnable} insertCategory
 * @property {Runnable} insertProduct
 * @property {Runnable} insertOrder
 * @property {Runnable} insertLine
 * @property {Runnable} insertInvoice
 * @property {Runnable} insertInvoiceLine
 * @property {Runnable} insertVat
 * @property {Runnable} upsertSequence
 * @property {Runnable} insertSetting
 */

export function createFixtureInserter(database) {
  const statements = prepareStatements(database);
  const categoryIds = new Set();
  const usedOrderIds = new Set();
  /** @type {{issuer: object | null}} */
  const state = {issuer: null};

  return {
    insertProfile(profile) {
      saveProfile(statements, state, profile);
    },
    insertSetting(setting) {
      statements.insertSetting.run(setting.key, JSON.stringify(setting.value));
    },
    insertCategory(category) {
      saveCategory(statements, categoryIds, category);
    },
    insertProduct(product) {
      saveProduct(statements, categoryIds, product);
    },
    insertOrder(order) {
      saveOrder(statements, state, usedOrderIds, order);
    }
  };
}

/**
 * @param {{prepare: Function}} database
 * @returns {SeedStatements}
 */
function prepareStatements(database) {
  return {
    insertCategory: database.prepare('INSERT INTO category (id, name) VALUES (?, ?)'),
    insertProduct: database.prepare(
      'INSERT INTO product (barcode, name, description, price, price_cents, base_price, base_price_cents, stock, stock_min, status, weighted, category_id, vat_percent, vat_kind, vat_cause, image_name) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    insertOrder: database.prepare(
      'INSERT INTO "order" (id, created_at, total, total_cents, payment_method, tendered_cents, change_cents, payment_parts) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    insertLine: database.prepare(
      'INSERT INTO line (order_id, barcode, name, price, quantity, price_cents, quantity_milli, amount_cents, vat_percent, vat_kind, vat_cause) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    insertInvoice: database.prepare(
      'INSERT INTO invoice (id, series, number, invoice_number, issued_at, issue_date, type, issuer_json, order_id, status, cancelled_at, total, total_cents) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    insertInvoiceLine: database.prepare(
      'INSERT INTO invoice_line (invoice_id, position, barcode, name, price, quantity, amount, price_cents, quantity_milli, amount_cents, vat_percent, vat_kind, vat_cause, kind, weighted) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    insertVat: database.prepare(
      'INSERT INTO invoice_vat (invoice_id, position, kind, percent, cause, base_cents, quota_cents, gross_cents) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ),
    upsertSequence: database.prepare(UPSERT_SEQUENCE_SQL),
    insertSetting: database.prepare('INSERT INTO setting (key, value_json) VALUES (?, ?)')
  };
}

/**
 * @param {SeedStatements} statements
 * @param {{issuer: object | null}} state
 * @param {object | null | undefined} profile
 */
function saveProfile(statements, state, profile) {
  if (!profile) {
    return;
  }
  statements.insertSetting.run('shop_profile', JSON.stringify(profile));
  state.issuer = issuerSnapshot(profile);
}

/**
 * @param {SeedStatements} statements
 * @param {Set<string>} categoryIds
 * @param {{_id: string, _name: string}} category
 */
function saveCategory(statements, categoryIds, category) {
  const id = String(category._id);
  statements.insertCategory.run(id, category._name);
  categoryIds.add(id);
}

/**
 * @param {SeedStatements} statements
 * @param {Set<string>} categoryIds
 * @param {SeedProduct} product
 */
function saveProduct(statements, categoryIds, product) {
  const categoryId = rememberCategory(statements, categoryIds, product._categoryId);
  const vat = vatOf({
    vatPercent: product._vatPercent,
    vatKind: product._vatKind,
    vatCause: product._vatCause
  });
  const price = storedMoney(product._price);
  const basePrice = storedMoney(product._basePrice);
  statements.insertProduct.run(
    product._barcode,
    textOrNull(product._name),
    textOrNull(product._description),
    price[0],
    price[1],
    basePrice[0],
    basePrice[1],
    numberOrNull(product._stock),
    numberOrNull(product._stockMin),
    textOrNull(product._status),
    bit(product._weighted),
    categoryId,
    vat.percent,
    vat.kind,
    vat.cause,
    textOrNull(product._imageName)
  );
}

/**
 * @param {SeedStatements} statements
 * @param {Set<string>} categoryIds
 * @param {string | null | undefined} categoryId
 * @returns {string | null}
 */
function rememberCategory(statements, categoryIds, categoryId) {
  if (categoryId == null) {
    return null;
  }
  const id = String(categoryId);
  if (!categoryIds.has(id)) {
    statements.insertCategory.run(id, id);
    categoryIds.add(id);
  }
  return id;
}

/**
 * @param {SeedStatements} statements
 * @param {{issuer: object | null}} state
 * @param {Set<string>} usedOrderIds
 * @param {SeedOrder} order
 */
function saveOrder(statements, state, usedOrderIds, order) {
  const id = allocateId(order._id, usedOrderIds);
  const createdAt = toStoredBound(order._createdAt);
  const payment = paymentValues(order._payment);
  statements.insertOrder.run(
    id,
    createdAt,
    eurosOf(order._total),
    centsOf(order._total),
    payment[0],
    payment[1],
    payment[2],
    payment[3]
  );
  (order._lines || []).forEach(line => insertSoldLine(statements.insertLine, id, line));
  if (order._invoice) {
    insertSoldInvoice(statements, order, id, createdAt, state.issuer);
  }
}

/**
 * @param {Runnable} insertLine
 * @param {string} orderId
 * @param {SeedLine} line
 */
function insertSoldLine(insertLine, orderId, line) {
  const vat = vatOf(line);
  insertLine.run(
    orderId,
    line.barcode,
    line.name,
    eurosOf(line.price),
    unitsOf(line.quantity),
    centsOf(line.price),
    milliOf(line.quantity),
    lineAmountCents(line),
    vat.percent,
    vat.kind,
    vat.cause
  );
}

/**
 * @param {SeedStatements} statements
 * @param {SeedOrder} order
 * @param {string} orderId
 * @param {string} createdAt
 * @param {object | null} issuer
 */
function insertSoldInvoice(statements, order, orderId, createdAt, issuer) {
  const invoice = order._invoice;
  if (!invoice) {
    return;
  }
  const invoiceId = 'inv-' + orderId;
  const lines = order._lines || [];
  statements.insertInvoice.run(
    invoiceId,
    String(invoice.series),
    Number(invoice.number),
    String(invoice.invoiceNumber),
    createdAt,
    String(createdAt).slice(0, 10),
    'F2',
    issuer ? JSON.stringify(issuer) : null,
    orderId,
    'ISSUED',
    null,
    eurosOf(order._total),
    centsOf(order._total)
  );
  lines.forEach((line, position) => insertInvoiceLine(statements.insertInvoiceLine, invoiceId, position, line));
  VatBreakdown.fromLines(lines.map(breakdownLine)).forEach((row, position) => {
    statements.insertVat.run(
      invoiceId,
      position,
      row.rate.kind,
      row.rate.percent,
      row.rate.cause,
      row.base.cents,
      row.quota.cents,
      row.gross.cents
    );
  });
  statements.upsertSequence.run(String(invoice.series), Number(invoice.number));
}

/**
 * @param {Runnable} statement
 * @param {string} invoiceId
 * @param {number} position
 * @param {SeedLine} line
 */
function insertInvoiceLine(statement, invoiceId, position, line) {
  const amount = lineAmountCents(line);
  const vat = vatOf(line);
  statement.run(
    invoiceId,
    position,
    line.barcode == null ? '' : String(line.barcode),
    line.name == null ? '' : String(line.name),
    eurosOf(line.price),
    unitsOf(line.quantity),
    eurosFromCents(amount),
    centsOf(line.price),
    milliOf(line.quantity),
    amount,
    vat.percent,
    vat.kind,
    vat.cause,
    'PRODUCT',
    bit(line.weighted)
  );
}

/**
 * @param {number | string | null | undefined} value
 * @returns {string | null}
 */
function textOrNull(value) {
  if (value == null) {
    return null;
  }
  return String(value);
}

/**
 * @param {number | null | undefined} value
 * @returns {number | null}
 */
function numberOrNull(value) {
  if (value == null) {
    return null;
  }
  return value;
}

/**
 * @param {number | string | null | undefined} value
 * @returns {[number | null, number | null]}
 */
function storedMoney(value) {
  if (value == null) {
    return [null, null];
  }
  return [eurosOf(value), centsOf(value)];
}

/**
 * @param {SeedLine} line
 * @returns {{amount: Money, vatRate: {percent: number, kind: string, cause: string | null}}}
 */
function breakdownLine(line) {
  return {
    amount: Money.ofCents(lineAmountCents(line)),
    vatRate: vatOf(line)
  };
}

/**
 * Deletes the shop rows a demo reset replaces. Schema migrations stay.
 * Invoice guards are dropped first so the issued-invoice triggers allow the delete.
 * @param {{exec: Function}} database
 */
export function clearShopData(database) {
  dropInvoiceGuards(database);
  database.exec('DELETE FROM domain_event_processing');
  database.exec('DELETE FROM domain_event');
  database.exec('DELETE FROM invoice_vat');
  database.exec('DELETE FROM invoice_line');
  database.exec('DELETE FROM invoice');
  database.exec('DELETE FROM invoice_sequence');
  database.exec('DELETE FROM setting');
  database.exec('DELETE FROM line');
  database.exec('DELETE FROM "order"');
  database.exec('DELETE FROM product_sale_order');
  database.exec('DELETE FROM product_sale_day');
  database.exec('DELETE FROM product');
  database.exec('DELETE FROM category');
  database.exec('DELETE FROM plugin_secret');
  database.exec('DELETE FROM plugin_state');
}

/**
 * Runs `write` in one transaction and rolls it back when `write` throws.
 * @param {{exec: Function}} database
 * @param {() => void} write
 */
export function runSeedTransaction(database, write) {
  database.exec('BEGIN');
  try {
    write();
    database.exec('COMMIT');
  } catch (error) {
    rollback(database);
    throw error;
  }
}

/**
 * @param {{exec: Function}} database
 */
function rollback(database) {
  try {
    database.exec('ROLLBACK');
  } catch (rollbackError) {
    // A failed statement can already have ended the transaction.
  }
}

export function replaceSqliteData(database, {categories = [], products = [], orders = []} = {}) {
  const inserter = createFixtureInserter(database);
  runSeedTransaction(database, () => {
    clearShopData(database);
    categories.forEach(category => inserter.insertCategory(category));
    products.forEach(product => inserter.insertProduct(product));
    orders.forEach(order => inserter.insertOrder(order));
    installInvoiceGuards(database);
  });
}
