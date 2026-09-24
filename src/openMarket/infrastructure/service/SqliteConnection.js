import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import sqliteDatabasePath from './sqliteDatabasePath';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS category (
  id TEXT PRIMARY KEY,
  name TEXT
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
  category_id TEXT
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

export default class SqliteConnection {
  constructor({filename} = {}) {
    const databasePath = filename || sqliteDatabasePath();
    if (databasePath !== ':memory:') {
      fs.mkdirSync(path.dirname(databasePath), {recursive: true});
    }
    this._database = new DatabaseSync(databasePath);
    this._database.exec(SCHEMA);
  }

  get database() {
    return this._database;
  }
}
