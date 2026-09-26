import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
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
`;

function ensureColumn(database, table, column, definition) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(columnInfo => columnInfo.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export default class SqliteConnection {
  constructor({filename} = {}) {
    const databasePath = filename || sqliteDatabasePath();
    if (databasePath !== ':memory:') {
      fs.mkdirSync(path.dirname(databasePath), {recursive: true});
    }
    this._database = new DatabaseSync(databasePath);
    this._database.exec(SCHEMA);
    ensureColumn(this._database, 'category', 'image_name', 'TEXT');
    ensureColumn(this._database, 'product', 'image_name', 'TEXT');
  }

  get database() {
    return this._database;
  }
}
