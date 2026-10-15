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

describe('Money migration', () => {
  const filename = path.join(os.tmpdir(), `openmarket-money-${process.pid}-${Date.now()}.sqlite`);

  afterEach(() => {
    fs.rmSync(filename, {force: true});
    fs.rmSync(filename + '-wal', {force: true});
    fs.rmSync(filename + '-shm', {force: true});
  });

  it('copies stored amounts into cents, restores invoice guards, and does nothing the second time', () => {
    const legacy = new DatabaseSync(filename);
    legacy.exec(LEGACY_SCHEMA);
    legacy.prepare('INSERT INTO product (barcode, name, price, base_price) VALUES (?, ?, ?, ?)')
      .run('1', 'Ham', 18.5, 10);
    legacy.prepare('INSERT INTO "order" (id, created_at, total) VALUES (?, ?, ?)')
      .run('order-1', '2026-10-15 12:00:00', 6.47);
    legacy.prepare('INSERT INTO line (order_id, barcode, name, price, quantity) VALUES (?, ?, ?, ?, ?)')
      .run('order-1', '1', 'Ham', 18.5, 0.35);
    legacy.prepare(
      'INSERT INTO invoice (id, series, number, invoice_number, issued_at, order_id, status, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run('inv-1', '2026', 1, '2026/000001', '2026-10-15T12:00:00.000Z', 'order-1', 'ISSUED', 6.47);
    legacy.prepare(
      'INSERT INTO invoice_line (invoice_id, position, barcode, name, price, quantity, amount) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('inv-1', 0, '1', 'Ham', 18.5, 0.35, 6.47);
    legacy.prepare(
      'INSERT INTO product_sale_day (barcode, name, sold_on, quantity, amount) VALUES (?, ?, ?, ?, ?)'
    ).run('1', 'Ham', '2026-10-15', 0.35, 6.47);
    legacy.close();

    const opened = new SqliteConnection({filename});
    const database = opened.database;
    expect(database.prepare('SELECT price_cents, base_price_cents FROM product').get())
      .to.deep.equal({price_cents: 1850, base_price_cents: 1000});
    expect(database.prepare('SELECT total_cents FROM "order"').get().total_cents).to.equal(647);
    const line = database.prepare('SELECT price_cents, quantity_milli, amount_cents FROM line').get();
    expect(line.price_cents).to.equal(1850);
    expect(line.quantity_milli).to.equal(350);
    expect(line.amount_cents).to.equal(647);
    expect(database.prepare('SELECT total_cents FROM invoice').get().total_cents).to.equal(647);
    expect(database.prepare('SELECT amount_cents FROM invoice_line').get().amount_cents).to.equal(647);
    expect(database.prepare('SELECT amount_cents FROM product_sale_day').get().amount_cents).to.equal(647);
    expect(() => database.prepare('UPDATE invoice SET total_cents = 1 WHERE id = ?').run('inv-1'))
      .to.throw(/cannot change/);
    expect(() => database.prepare('UPDATE invoice_line SET amount_cents = 1 WHERE invoice_id = ?').run('inv-1'))
      .to.throw(/cannot change/);

    database.close();
    const again = new SqliteConnection({filename});
    expect(again.database.prepare('SELECT COUNT(*) AS total FROM schema_migration').get().total).to.equal(1);
    expect(again.database.prepare('SELECT total_cents FROM invoice').get().total_cents).to.equal(647);
    expect(again.database.prepare('SELECT amount_cents FROM invoice_line').get().amount_cents).to.equal(647);
    again.database.close();
  });
});
