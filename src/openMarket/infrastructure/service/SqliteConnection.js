import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import Money from '../../domain/money/Money';
import Quantity from '../../domain/money/Quantity';
import VatBreakdown from '../../domain/tax/VatBreakdown';
import SystemClock from './SystemClock';
import sqliteDatabasePath from './sqliteDatabasePath';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS category (
  id TEXT PRIMARY KEY,
  name TEXT,
  image_name TEXT
);
CREATE TABLE IF NOT EXISTS product (
  barcode TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  price REAL,
  base_price REAL,
  price_cents INTEGER,
  base_price_cents INTEGER,
  vat_percent INTEGER NOT NULL DEFAULT 21,
  vat_kind TEXT NOT NULL DEFAULT 'S1',
  vat_cause TEXT,
  stock REAL,
  stock_min REAL,
  status TEXT,
  weighted INTEGER,
  category_id TEXT,
  image_name TEXT
);
CREATE TABLE IF NOT EXISTS "order" (
  id TEXT PRIMARY KEY,
  created_at TEXT,
  total REAL,
  total_cents INTEGER
);
CREATE TABLE IF NOT EXISTS line (
  order_id TEXT,
  barcode TEXT,
  name TEXT,
  price REAL,
  quantity REAL,
  price_cents INTEGER,
  quantity_milli INTEGER,
  amount_cents INTEGER,
  vat_percent INTEGER NOT NULL DEFAULT 21,
  vat_kind TEXT NOT NULL DEFAULT 'S1',
  vat_cause TEXT
);
CREATE TABLE IF NOT EXISTS product_sale_day (
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  sold_on TEXT NOT NULL,
  quantity REAL NOT NULL,
  amount REAL NOT NULL,
  amount_cents INTEGER,
  PRIMARY KEY (barcode, sold_on)
);
CREATE INDEX IF NOT EXISTS product_sale_day_sold_on ON product_sale_day (sold_on);
CREATE TABLE IF NOT EXISTS product_sale_order (
  order_id TEXT PRIMARY KEY
);
CREATE TABLE IF NOT EXISTS domain_event (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  aggregate_id TEXT,
  created_at TEXT NOT NULL,
  dispatched_at TEXT
);
CREATE TABLE IF NOT EXISTS domain_event_subscriber (
  subscriber_name TEXT PRIMARY KEY,
  registered_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS domain_event_processing (
  event_id TEXT NOT NULL,
  subscriber_name TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (event_id, subscriber_name)
);
CREATE INDEX IF NOT EXISTS domain_event_processing_due
  ON domain_event_processing (subscriber_name, status);
CREATE TABLE IF NOT EXISTS plugin_state (
  plugin_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL,
  config_json TEXT NOT NULL,
  last_error TEXT
);
CREATE TABLE IF NOT EXISTS invoice_sequence (
  series TEXT PRIMARY KEY,
  last_number INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS invoice (
  id TEXT PRIMARY KEY,
  series TEXT NOT NULL,
  number INTEGER NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  issued_at TEXT NOT NULL,
  order_id TEXT,
  status TEXT NOT NULL,
  cancelled_at TEXT,
  total REAL NOT NULL,
  total_cents INTEGER,
  issue_date TEXT,
  type TEXT NOT NULL DEFAULT 'F2',
  issuer_json TEXT,
  corrects_invoice_id TEXT,
  UNIQUE (series, number)
);
CREATE TABLE IF NOT EXISTS setting (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS invoice_line (
  invoice_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity REAL NOT NULL,
  amount REAL,
  price_cents INTEGER,
  quantity_milli INTEGER,
  amount_cents INTEGER,
  vat_percent INTEGER NOT NULL DEFAULT 21,
  vat_kind TEXT NOT NULL DEFAULT 'S1',
  vat_cause TEXT,
  PRIMARY KEY (invoice_id, position)
);
CREATE TABLE IF NOT EXISTS invoice_vat (
  invoice_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  kind TEXT NOT NULL,
  percent INTEGER NOT NULL,
  cause TEXT,
  base_cents INTEGER NOT NULL,
  quota_cents INTEGER NOT NULL,
  gross_cents INTEGER NOT NULL,
  PRIMARY KEY (invoice_id, position)
);
CREATE TABLE IF NOT EXISTS schema_migration (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS invoice_order_id ON invoice (order_id);
`;

/**
 * Cents for a stored euro amount. The text of the number is parsed, not multiplied.
 * @param {number | string | null | undefined} value
 * @returns {number}
 */
function storedCents(value) {
  if (value == null || value === '') {
    return 0;
  }
  return Money.fromEuros(String(value)).cents;
}

/**
 * @param {number | string | null | undefined} value
 * @returns {number}
 */
function storedMilli(value) {
  if (value == null || value === '') {
    return 0;
  }
  return Quantity.fromDecimal(String(value)).milli;
}

/**
 * The line total the previous float total used, rounded to euro cents.
 * @param {number | null} price
 * @param {number | null} quantity
 * @returns {number}
 */
function historicalLineCents(price, quantity) {
  const places = 2;
  const euros = Number((Number(price) * Number(quantity)).toFixed(places));
  return storedCents(euros);
}

const VAT_RATES_MIGRATION = 'vat_rates_v1';

/**
 * Gives every product, order line and invoice line a 21 % S1 rate, and stores
 * one 21 % breakdown for invoices that were issued before VAT existed.
 * Historic rates are assumed. A second open finds the schema_migration row and skips.
 * @param {{prepare: Function, exec: Function}} database
 */
function migrateVatRates(database) {
  ensureColumn(database, 'product', 'vat_percent', "INTEGER NOT NULL DEFAULT 21");
  ensureColumn(database, 'product', 'vat_kind', "TEXT NOT NULL DEFAULT 'S1'");
  ensureColumn(database, 'product', 'vat_cause', 'TEXT');
  ensureColumn(database, 'line', 'vat_percent', "INTEGER NOT NULL DEFAULT 21");
  ensureColumn(database, 'line', 'vat_kind', "TEXT NOT NULL DEFAULT 'S1'");
  ensureColumn(database, 'line', 'vat_cause', 'TEXT');
  ensureColumn(database, 'invoice_line', 'vat_percent', "INTEGER NOT NULL DEFAULT 21");
  ensureColumn(database, 'invoice_line', 'vat_kind', "TEXT NOT NULL DEFAULT 'S1'");
  ensureColumn(database, 'invoice_line', 'vat_cause', 'TEXT');
  database.exec(`CREATE TABLE IF NOT EXISTS invoice_vat (
    invoice_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    kind TEXT NOT NULL,
    percent INTEGER NOT NULL,
    cause TEXT,
    base_cents INTEGER NOT NULL,
    quota_cents INTEGER NOT NULL,
    gross_cents INTEGER NOT NULL,
    PRIMARY KEY (invoice_id, position)
  )`);
  const applied = database.prepare('SELECT name FROM schema_migration WHERE name = ?').get(VAT_RATES_MIGRATION);
  if (applied) {
    return;
  }
  if (!hasColumn(database, 'invoice', 'id') || !hasColumn(database, 'invoice_line', 'invoice_id')) {
    database.prepare('INSERT INTO schema_migration (name, applied_at) VALUES (?, ?)').run(
      VAT_RATES_MIGRATION,
      new Date().toISOString()
    );
    return;
  }
  dropInvoiceGuards(database);
  const insert = database.prepare(
    'INSERT INTO invoice_vat (invoice_id, position, kind, percent, cause, base_cents, quota_cents, gross_cents) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const invoices = database.prepare('SELECT id FROM invoice').all();
  invoices.forEach(invoice => {
    const present = database.prepare('SELECT 1 AS present FROM invoice_vat WHERE invoice_id = ?').get(invoice.id);
    if (present) {
      return;
    }
    const lines = database.prepare(
      'SELECT amount, amount_cents, vat_percent, vat_kind, vat_cause FROM invoice_line WHERE invoice_id = ? ORDER BY position'
    ).all(invoice.id);
    const breakdown = VatBreakdown.fromLines(lines.map(line => ({
      amount: line.amount_cents == null ? Money.fromEuros(line.amount == null ? 0 : line.amount) : Money.ofCents(Number(line.amount_cents)),
      vatRate: {
        percent: line.vat_percent == null ? 21 : Number(line.vat_percent),
        kind: line.vat_kind || 'S1',
        cause: line.vat_cause
      }
    })));
    breakdown.forEach((row, position) => {
      insert.run(
        invoice.id,
        position,
        row.rate.kind,
        row.rate.percent,
        row.rate.cause,
        row.base.cents,
        row.quota.cents,
        row.gross.cents
      );
    });
  });
  database.prepare('INSERT INTO schema_migration (name, applied_at) VALUES (?, ?)').run(
    VAT_RATES_MIGRATION,
    new Date().toISOString()
  );
}

const ISSUER_MIGRATION = 'invoice_issuer_v1';

/**
 * Adds the local issue date and leaves issuer_json null on invoices that
 * were issued before the shop profile existed.
 * @param {{prepare: Function, exec: Function}} database
 */
function migrateIssuer(database) {
  database.exec(`CREATE TABLE IF NOT EXISTS setting (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL
  )`);
  ensureColumn(database, 'invoice', 'issue_date', 'TEXT');
  ensureColumn(database, 'invoice', 'type', "TEXT NOT NULL DEFAULT 'F2'");
  ensureColumn(database, 'invoice', 'issuer_json', 'TEXT');
  ensureColumn(database, 'invoice', 'corrects_invoice_id', 'TEXT');
  const applied = database.prepare('SELECT name FROM schema_migration WHERE name = ?').get(ISSUER_MIGRATION);
  if (applied || !hasColumn(database, 'invoice', 'issued_at')) {
    if (!applied) {
      database.prepare('INSERT INTO schema_migration (name, applied_at) VALUES (?, ?)').run(
        ISSUER_MIGRATION,
        new Date().toISOString()
      );
    }
    return;
  }
  const clock = new SystemClock();
  const rows = database.prepare('SELECT id, issued_at FROM invoice WHERE issue_date IS NULL').all();
  if (rows.length > 0) {
    dropInvoiceGuards(database);
    const update = database.prepare('UPDATE invoice SET issue_date = ? WHERE id = ? AND issue_date IS NULL');
    rows.forEach(row => {
      update.run(clock.localDate({instant: row.issued_at}), row.id);
    });
  }
  database.prepare('INSERT INTO schema_migration (name, applied_at) VALUES (?, ?)').run(
    ISSUER_MIGRATION,
    new Date().toISOString()
  );
}

function tableColumns(database, table) {
  return database.prepare(`PRAGMA table_info(${table})`).all();
}

function hasColumn(database, table, column) {
  return tableColumns(database, table).some(columnInfo => columnInfo.name === column);
}

function ensureColumn(database, table, column, definition) {
  if (!hasColumn(database, table, column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/**
 * Fills line amounts that were never stored. Runs once per row: a later open
 * leaves a stored amount alone, including one that no longer matches price times quantity.
 * The fill uses the same cents product as an order total.
 * @param {{prepare: Function}} database
 */
const INVOICE_GUARD_SQL = `
CREATE TRIGGER IF NOT EXISTS invoice_forbid_rewrite
BEFORE UPDATE OF series, number, invoice_number, issued_at, issue_date, type, issuer_json, corrects_invoice_id, total, total_cents ON invoice
BEGIN
  SELECT RAISE(ABORT, 'An issued invoice cannot change its number, date, or total');
END;
CREATE TRIGGER IF NOT EXISTS invoice_line_forbid_update
BEFORE UPDATE ON invoice_line
BEGIN
  SELECT RAISE(ABORT, 'An issued invoice line cannot change');
END;
CREATE TRIGGER IF NOT EXISTS invoice_forbid_delete
BEFORE DELETE ON invoice
BEGIN
  SELECT RAISE(ABORT, 'An issued invoice cannot be deleted');
END;
CREATE TRIGGER IF NOT EXISTS invoice_line_forbid_delete
BEFORE DELETE ON invoice_line
BEGIN
  SELECT RAISE(ABORT, 'An issued invoice line cannot be deleted');
END;
CREATE TRIGGER IF NOT EXISTS invoice_vat_forbid_update
BEFORE UPDATE ON invoice_vat
BEGIN
  SELECT RAISE(ABORT, 'An issued invoice VAT breakdown cannot change');
END;
CREATE TRIGGER IF NOT EXISTS invoice_vat_forbid_delete
BEFORE DELETE ON invoice_vat
BEGIN
  SELECT RAISE(ABORT, 'An issued invoice VAT breakdown cannot be deleted');
END;
`;

/** @param {{exec: Function}} database */
export function dropInvoiceGuards(database) {
  database.exec('DROP TRIGGER IF EXISTS invoice_forbid_rewrite');
  database.exec('DROP TRIGGER IF EXISTS invoice_line_forbid_update');
  database.exec('DROP TRIGGER IF EXISTS invoice_forbid_delete');
  database.exec('DROP TRIGGER IF EXISTS invoice_line_forbid_delete');
  database.exec('DROP TRIGGER IF EXISTS invoice_vat_forbid_update');
  database.exec('DROP TRIGGER IF EXISTS invoice_vat_forbid_delete');
}

/** @param {{exec: Function}} database */
export function installInvoiceGuards(database) {
  database.exec(INVOICE_GUARD_SQL);
}

function backfillInvoiceLineAmounts(database) {
  const pending = database.prepare(
    'SELECT invoice_id, position, price, quantity FROM invoice_line WHERE amount IS NULL'
  ).all();
  if (pending.length === 0) {
    return;
  }
  dropInvoiceGuards(database);
  const update = database.prepare(
    'UPDATE invoice_line SET amount = ? WHERE invoice_id = ? AND position = ? AND amount IS NULL'
  );
  pending.forEach(row => {
    const amount = Money.fromEuros(row.price).times(Quantity.fromDecimal(row.quantity));
    update.run(amount.toEuros(), row.invoice_id, row.position);
  });
}

const MONEY_CENTS_MIGRATION = 'money_integer_cents';

/**
 * Copies stored euro amounts into integer cents. Issued invoice amounts are
 * copied, not recalculated. A second open finds the schema_migration row and skips.
 * @param {{prepare: Function, exec: Function}} database
 */
function migrateMoneyCents(database) {
  ensureColumn(database, 'product', 'price_cents', 'INTEGER');
  ensureColumn(database, 'product', 'base_price_cents', 'INTEGER');
  ensureColumn(database, '"order"', 'total_cents', 'INTEGER');
  ensureColumn(database, 'line', 'price_cents', 'INTEGER');
  ensureColumn(database, 'line', 'quantity_milli', 'INTEGER');
  ensureColumn(database, 'line', 'amount_cents', 'INTEGER');
  ensureColumn(database, 'product_sale_day', 'amount_cents', 'INTEGER');
  ensureColumn(database, 'invoice', 'total_cents', 'INTEGER');
  ensureColumn(database, 'invoice_line', 'price_cents', 'INTEGER');
  ensureColumn(database, 'invoice_line', 'quantity_milli', 'INTEGER');
  ensureColumn(database, 'invoice_line', 'amount_cents', 'INTEGER');
  const applied = database.prepare(
    'SELECT name FROM schema_migration WHERE name = ?'
  ).get(MONEY_CENTS_MIGRATION);
  if (applied) {
    return;
  }
  // Stored REAL values are copied from their decimal text. SQLite ROUND(real * 100)
  // can turn a stored 6.47 into 648. Order lines never stored an amount, so their
  // cents use the same toFixed product the old total used.
  if (hasColumn(database, 'product', 'price')) {
    const products = database.prepare('SELECT rowid AS rowid, price, base_price FROM product').all();
    const update = database.prepare(
      'UPDATE product SET price_cents = ?, base_price_cents = ? WHERE rowid = ?'
    );
    products.forEach(row => {
      update.run(storedCents(row.price), storedCents(row.base_price), row.rowid);
    });
  }
  if (hasColumn(database, '"order"', 'total')) {
    const orders = database.prepare('SELECT rowid AS rowid, total FROM "order"').all();
    const update = database.prepare('UPDATE "order" SET total_cents = ? WHERE rowid = ?');
    orders.forEach(row => update.run(storedCents(row.total), row.rowid));
  }
  if (hasColumn(database, 'line', 'price') && hasColumn(database, 'line', 'quantity')) {
    const lines = database.prepare('SELECT rowid AS rowid, price, quantity FROM line').all();
    const update = database.prepare(
      'UPDATE line SET price_cents = ?, quantity_milli = ?, amount_cents = ? WHERE rowid = ?'
    );
    lines.forEach(row => {
      update.run(
        storedCents(row.price),
        storedMilli(row.quantity),
        historicalLineCents(row.price, row.quantity),
        row.rowid
      );
    });
  }
  if (hasColumn(database, 'product_sale_day', 'amount')) {
    const days = database.prepare('SELECT rowid AS rowid, amount FROM product_sale_day').all();
    const update = database.prepare('UPDATE product_sale_day SET amount_cents = ? WHERE rowid = ?');
    days.forEach(row => update.run(storedCents(row.amount), row.rowid));
  }
  dropInvoiceGuards(database);
  if (hasColumn(database, 'invoice', 'total')) {
    const invoices = database.prepare('SELECT rowid AS rowid, total FROM invoice').all();
    const update = database.prepare('UPDATE invoice SET total_cents = ? WHERE rowid = ?');
    invoices.forEach(row => update.run(storedCents(row.total), row.rowid));
  }
  if (hasColumn(database, 'invoice_line', 'amount')) {
    const invoiceLines = database.prepare(
      'SELECT rowid AS rowid, price, quantity, amount FROM invoice_line'
    ).all();
    const update = database.prepare(
      'UPDATE invoice_line SET price_cents = ?, quantity_milli = ?, amount_cents = ? WHERE rowid = ?'
    );
    invoiceLines.forEach(row => {
      update.run(
        storedCents(row.price),
        storedMilli(row.quantity),
        storedCents(row.amount),
        row.rowid
      );
    });
  }
  database.prepare(
    'INSERT INTO schema_migration (name, applied_at) VALUES (?, ?)'
  ).run(MONEY_CENTS_MIGRATION, new Date().toISOString());
}

/**
 * Replaces the plain order index with a unique one. A database created before
 * that change keeps the old index name, so CREATE UNIQUE INDEX IF NOT EXISTS does not replace it.
 * @param {{prepare: Function, exec: Function}} database
 */
function ensureUniqueInvoiceOrder(database) {
  const indexes = database.prepare(`PRAGMA index_list('invoice')`).all();
  const current = indexes.find(index => index.name === 'invoice_order_id');
  if (current && Number(current.unique) === 1) {
    return;
  }
  if (current) {
    database.exec('DROP INDEX invoice_order_id');
  }
  database.exec('CREATE UNIQUE INDEX invoice_order_id ON invoice (order_id)');
}

export default class SqliteConnection {
  /**
   * @param {{filename?: string}} [options]
   */
  constructor({filename} = {}) {
    const databasePath = filename || sqliteDatabasePath();
    if (databasePath !== ':memory:') {
      fs.mkdirSync(path.dirname(databasePath), {recursive: true});
    }
    this._database = new DatabaseSync(databasePath);
    this._database.exec(SCHEMA);
    ensureColumn(this._database, 'category', 'image_name', 'TEXT');
    ensureColumn(this._database, 'product', 'image_name', 'TEXT');
    ensureColumn(this._database, 'domain_event', 'dispatched_at', 'TEXT');
    ensureColumn(this._database, 'invoice_line', 'amount', 'REAL');
    this._database.exec(`CREATE TABLE IF NOT EXISTS schema_migration (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )`);
    backfillInvoiceLineAmounts(this._database);
    migrateMoneyCents(this._database);
    migrateVatRates(this._database);
    migrateIssuer(this._database);
    ensureUniqueInvoiceOrder(this._database);
    dropInvoiceGuards(this._database);
    installInvoiceGuards(this._database);
  }

  get database() {
    return this._database;
  }
}
