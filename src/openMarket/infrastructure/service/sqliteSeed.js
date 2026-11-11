import { toStoredBound } from './sqliteDates';
import {dropInvoiceGuards, installInvoiceGuards} from './SqliteConnection';
import issuerSnapshot from '../../domain/shop/issuerSnapshot';
import Order from '../../domain/order/Order';
import VatBreakdown from '../../domain/tax/VatBreakdown';
import SqliteOrderRepository from '../order/SqliteOrderRepository';
import {centsOf, eurosOf, milliOf, unitsOf} from './storedMoney';
/** @typedef {import('../../domain/order/Order').OrderLine} OrderLine */
/** @typedef {import('../../domain/invoice/InvoiceNumber').default} InvoiceNumber */

const UPSERT_SEQUENCE_SQL = 'INSERT INTO invoice_sequence (series, last_number) VALUES (?, ?) ' +
  'ON CONFLICT(series) DO UPDATE SET last_number = MAX(invoice_sequence.last_number, excluded.last_number)';

/**
 * @param {string} base
 * @param {Set<string>} used
 * @returns {string}
 */
function allocateId(base, used) {
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
 * @typedef {object} Runnable
 * @property {(...values: any[]) => unknown} run
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
 * A placed order and, when it was issued one, its invoice number.
 * Older shops have orders with no invoice and no payment.
 * @typedef {object} SeedOrder
 * @property {Order} order
 * @property {InvoiceNumber | null} [invoice]
 */

/**
 * @typedef {object} SeedStatements
 * @property {Runnable} insertCategory
 * @property {Runnable} insertProduct
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
  const orderRepository = new SqliteOrderRepository({connection: {database}, objectMapper: null, queryService: null});

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
    /** @param {SeedOrder} seed */
    insertOrder(seed) {
      saveOrder({statements, state, usedOrderIds, orderRepository}, seed);
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
 * Writes the order the way a sale does. Only a placed {@link Order} is accepted,
 * so every line already has a barcode, a name, a price, a quantity, and a VAT rate.
 * A repeated id gets the next free `#n` suffix.
 * @param {{statements: SeedStatements, state: {issuer: object | null}, usedOrderIds: Set<string>, orderRepository: SqliteOrderRepository}} context
 * @param {SeedOrder} seed
 */
function saveOrder({statements, state, usedOrderIds, orderRepository}, {order, invoice = null}) {
  if (!(order instanceof Order) || !order.isPlaced()) {
    throw new TypeError('A seed order must be a placed Order');
  }
  const id = allocateId(order.id, usedOrderIds);
  const stored = id === order.id
    ? order
    : Order.restore({id, lines: order.lines, date: order.createdAt, payment: order.payment});
  saveNow(orderRepository, stored);
  if (invoice) {
    insertSoldInvoice(statements, stored, invoice, state.issuer);
  }
}

/**
 * The repository writes synchronously. A failed write is thrown so the seed transaction rolls back.
 * @param {SqliteOrderRepository} orderRepository
 * @param {Order} order
 */
function saveNow(orderRepository, order) {
  let failure = null;
  orderRepository.save({order}).subscribe(() => {}, error => {
    failure = error;
  });
  if (failure) {
    throw failure;
  }
}

/**
 * @param {SeedStatements} statements
 * @param {Order} order
 * @param {InvoiceNumber} invoice
 * @param {object | null} issuer
 */
function insertSoldInvoice(statements, order, invoice, issuer) {
  const invoiceId = 'inv-' + order.id;
  const createdAt = toStoredBound(order.createdAt);
  const lines = order.lines;
  statements.insertInvoice.run(
    invoiceId,
    invoice.series,
    invoice.number,
    invoice.formatted,
    createdAt,
    createdAt.slice(0, 10),
    'F2',
    issuer ? JSON.stringify(issuer) : null,
    order.id,
    'ISSUED',
    null,
    eurosOf(order.total),
    centsOf(order.total)
  );
  lines.forEach((line, position) => insertInvoiceLine(statements.insertInvoiceLine, invoiceId, position, line));
  VatBreakdown.fromLines(lines).forEach((row, position) => {
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
  statements.upsertSequence.run(invoice.series, invoice.number);
}

/**
 * @param {Runnable} statement
 * @param {string} invoiceId
 * @param {number} position
 * @param {OrderLine} line
 */
function insertInvoiceLine(statement, invoiceId, position, line) {
  const vatRate = line.vatRate;
  statement.run(
    invoiceId,
    position,
    line.barcode,
    line.name,
    eurosOf(line.price),
    unitsOf(line.quantity),
    eurosOf(line.amount),
    centsOf(line.price),
    milliOf(line.quantity),
    centsOf(line.amount),
    vatRate.percent,
    vatRate.kind,
    vatRate.cause,
    line.kind === 'FREE' ? 'FREE' : 'PRODUCT',
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

/**
 * @param {{exec: Function, prepare: Function}} database
 * @param {{categories?: object[], products?: SeedProduct[], orders?: SeedOrder[]}} [seed]
 */
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
