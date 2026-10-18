import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import {DatabaseSync} from 'node:sqlite';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteOrderRepository from '../openMarket/infrastructure/order/SqliteOrderRepository';
import SqlOrderMapper from '../openMarket/infrastructure/order/SqlOrderMapper';
import Order from '../openMarket/domain/order/Order';
import Money from '../openMarket/domain/money/Money';
import VatRate from '../openMarket/domain/tax/VatRate';

const LEGACY = `
CREATE TABLE category (id TEXT PRIMARY KEY, name TEXT);
CREATE TABLE product (barcode TEXT PRIMARY KEY, name TEXT, price REAL, base_price REAL);
CREATE TABLE "order" (id TEXT PRIMARY KEY, created_at TEXT, total REAL);
CREATE TABLE line (order_id TEXT, barcode TEXT, name TEXT, price REAL, quantity REAL);
CREATE TABLE invoice (
  id TEXT PRIMARY KEY, series TEXT NOT NULL, number INTEGER NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE, issued_at TEXT NOT NULL, order_id TEXT,
  status TEXT NOT NULL, cancelled_at TEXT, total REAL NOT NULL
);
CREATE TABLE invoice_line (
  invoice_id TEXT NOT NULL, position INTEGER NOT NULL, barcode TEXT NOT NULL,
  name TEXT NOT NULL, price REAL NOT NULL, quantity REAL NOT NULL,
  PRIMARY KEY (invoice_id, position)
);
`;

describe('order line kind', () => {
  let file;

  afterEach(() => {
    if (file) {
      fs.rmSync(file, {force: true});
    }
  });

  it('adds kind once and round-trips a free line', done => {
    file = path.join(os.tmpdir(), `om-line-kind-${Date.now()}.sqlite`);
    const legacy = new DatabaseSync(file);
    legacy.exec(LEGACY);
    legacy.close();

    const first = new SqliteConnection({filename: file});
    const names = first.database.prepare('PRAGMA table_info(line)').all().map(column => column.name);
    const invoiceNames = first.database.prepare('PRAGMA table_info(invoice_line)').all().map(column => column.name);
    expect(names).to.include('kind');
    expect(invoiceNames).to.include('kind');
    expect(first.database.prepare(
      'SELECT count(*) AS total FROM schema_migration WHERE name = ?'
    ).get('order_line_kind_v1').total).to.equal(1);
    first.database.close();

    const second = new SqliteConnection({filename: file});
    expect(second.database.prepare(
      'SELECT count(*) AS total FROM schema_migration WHERE name = ?'
    ).get('order_line_kind_v1').total).to.equal(1);

    const repository = new SqliteOrderRepository({
      connection: second,
      objectMapper: new SqlOrderMapper(),
      queryService: {}
    });
    const order = Order.draft({id: 'o1', date: '18/10/2026 10:00:00'})
      .addLine({barcode: '0001', name: 'Milk', price: 2, quantity: 1})
      .addFreeLine({
        description: 'Venta libre',
        amount: Money.from('3.50'),
        vatRate: VatRate.of({kind: 'S1', percent: 10})
      })
      .place();

    repository.save({order}).flatMap(() => repository.findById({id: 'o1'})).subscribe(
      found => {
        expect(found.lines.map(line => line.kind)).to.deep.equal(['PRODUCT', 'FREE']);
        expect(found.lines[1].barcode).to.equal('');
        expect(found.lines[1].name).to.equal('Venta libre');
        expect(found.lines[1].amount.cents).to.equal(350);
        expect(found.lines[1].vatRate.code()).to.equal('S1:10');
        expect(found.total.cents).to.equal(550);
        second.database.close();
      },
      error => {
        try { second.database.close(); } catch (closeError) { /* already closed */ }
        done(error);
      },
      () => done()
    );
  });
});
