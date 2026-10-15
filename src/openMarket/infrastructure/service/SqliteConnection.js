import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import {multiply} from '../../domain/money';
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
  total REAL
);
CREATE TABLE IF NOT EXISTS line (
  order_id TEXT,
  barcode TEXT,
  name TEXT,
  price REAL,
  quantity REAL
);
CREATE TABLE IF NOT EXISTS product_sale_day (
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  sold_on TEXT NOT NULL,
  quantity REAL NOT NULL,
  amount REAL NOT NULL,
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
  UNIQUE (series, number)
);
CREATE TABLE IF NOT EXISTS invoice_line (
  invoice_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity REAL NOT NULL,
  amount REAL,
  PRIMARY KEY (invoice_id, position)
);
CREATE UNIQUE INDEX IF NOT EXISTS invoice_order_id ON invoice (order_id);
`;

function ensureColumn(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(columnInfo => columnInfo.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/**
 * Fills line amounts that were never stored. Runs once per row: a later open
 * leaves a stored amount alone, including one that no longer matches price times quantity.
 * The fill uses the same cents product as an order total.
 * @param {{prepare: Function}} database
 */
function backfillInvoiceLineAmounts(database) {
  const pending = database.prepare(
    'SELECT invoice_id, position, price, quantity FROM invoice_line WHERE amount IS NULL'
  ).all();
  if (pending.length === 0) {
    return;
  }
  const update = database.prepare(
    'UPDATE invoice_line SET amount = ? WHERE invoice_id = ? AND position = ? AND amount IS NULL'
  );
  pending.forEach(row => {
    update.run(multiply(row.price, row.quantity), row.invoice_id, row.position);
  });
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
    backfillInvoiceLineAmounts(this._database);
    ensureUniqueInvoiceOrder(this._database);
  }

  get database() {
    return this._database;
  }
}
