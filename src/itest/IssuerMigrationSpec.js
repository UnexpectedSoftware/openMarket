import {expect} from 'chai';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {DatabaseSync} from 'node:sqlite';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';

const LEGACY_SCHEMA = `
CREATE TABLE product (
  barcode TEXT PRIMARY KEY,
  name TEXT,
  price REAL,
  base_price REAL
);
CREATE TABLE "order" (
  id TEXT PRIMARY KEY,
  created_at TEXT,
  total REAL
);
CREATE TABLE line (
  order_id TEXT,
  barcode TEXT,
  name TEXT,
  price REAL,
  quantity REAL
);
CREATE TABLE product_sale_day (
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  sold_on TEXT NOT NULL,
  quantity REAL NOT NULL,
  amount REAL NOT NULL,
  PRIMARY KEY (barcode, sold_on)
);
CREATE TABLE invoice (
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
CREATE TABLE invoice_line (
  invoice_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  barcode TEXT NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity REAL NOT NULL,
  amount REAL,
  PRIMARY KEY (invoice_id, position)
);
`;

describe('Issuer migration', () => {
  const filename = path.join(os.tmpdir(), `openmarket-issuer-${process.pid}-${Date.now()}.sqlite`);

  afterEach(() => {
    fs.rmSync(filename, {force: true});
    fs.rmSync(filename + '-wal', {force: true});
    fs.rmSync(filename + '-shm', {force: true});
  });

  it('fills the Madrid issue date, leaves the issuer empty, and then guards that column', () => {
    const legacy = new DatabaseSync(filename);
    legacy.exec(LEGACY_SCHEMA);
    legacy.prepare(
      'INSERT INTO invoice (id, series, number, invoice_number, issued_at, order_id, status, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('inv-1', '2026', 1, '2026/000001', '2026-12-31T23:30:00.000Z', 'order-1', 'ISSUED', 1);
    legacy.prepare(
      'INSERT INTO invoice_line (invoice_id, position, barcode, name, price, quantity, amount) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('inv-1', 0, '1', 'Ham', 1, 1, 1);
    legacy.close();

    const opened = new SqliteConnection({filename});
    const database = opened.database;
    const row = database.prepare(
      'SELECT issue_date AS issueDate, type, issuer_json AS issuerJson FROM invoice WHERE id = ?'
    ).get('inv-1');
    expect(row.issueDate).to.equal('2027-01-01');
    expect(row.type).to.equal('F2');
    expect(row.issuerJson).to.equal(null);
    expect(() => database.prepare('UPDATE invoice SET issuer_json = ? WHERE id = ?').run('{"nif":"B12345674"}', 'inv-1'))
      .to.throw(/cannot change/);
    expect(() => database.prepare('UPDATE invoice SET issue_date = ? WHERE id = ?').run('2026-01-01', 'inv-1'))
      .to.throw(/cannot change/);

    database.close();
    const again = new SqliteConnection({filename});
    expect(again.database.prepare(
      "SELECT COUNT(*) AS total FROM schema_migration WHERE name = 'invoice_issuer_v1'"
    ).get().total).to.equal(1);
    expect(again.database.prepare('SELECT issue_date FROM invoice').get().issue_date).to.equal('2027-01-01');
    again.database.close();
  });
});
