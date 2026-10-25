import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import 'rxjs/add/operator/mergeMap';
import {DatabaseSync} from 'node:sqlite';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteOrderRepository from '../openMarket/infrastructure/order/SqliteOrderRepository';
import SqlOrderMapper from '../openMarket/infrastructure/order/SqlOrderMapper';
import SqliteSellPreferencesRepository from '../openMarket/infrastructure/shop/SqliteSellPreferencesRepository';
import Order from '../openMarket/domain/order/Order';
import Money from '../openMarket/domain/money/Money';

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

describe('order payment', () => {
  let file;

  afterEach(() => {
    if (file) {
      fs.rmSync(file, {force: true});
    }
  });

  it('adds the payment columns once and round-trips cash, card, and no payment', done => {
    file = path.join(os.tmpdir(), `om-payment-${Date.now()}-${process.pid}.sqlite`);
    const legacy = new DatabaseSync(file);
    legacy.exec(LEGACY);
    legacy.close();

    const first = new SqliteConnection({filename: file});
    const names = first.database.prepare('PRAGMA table_info("order")').all().map(column => column.name);
    expect(names).to.include('payment_method');
    expect(names).to.include('tendered_cents');
    expect(names).to.include('change_cents');
    expect(first.database.prepare(
      'SELECT count(*) AS total FROM schema_migration WHERE name = ?'
    ).get('order_payment_v1').total).to.equal(1);
    first.database.close();

    const second = new SqliteConnection({filename: file});
    expect(second.database.prepare(
      'SELECT count(*) AS total FROM schema_migration WHERE name = ?'
    ).get('order_payment_v1').total).to.equal(1);

    const repository = new SqliteOrderRepository({
      connection: second,
      objectMapper: new SqlOrderMapper(),
      queryService: {}
    });
    const cash = Order.draft({id: 'cash', date: '18/10/2026 10:00:00'})
      .addLine({barcode: '0001', name: 'Ham', price: Money.ofCents(1738), quantity: 1})
      .place()
      .recordPayment({method: 'cash', tenderedCents: 2000});
    const card = Order.draft({id: 'card', date: '18/10/2026 10:01:00'})
      .addLine({barcode: '0001', name: 'Ham', price: Money.ofCents(200), quantity: 1})
      .place()
      .recordPayment({method: 'card'});
    const plain = Order.draft({id: 'plain', date: '18/10/2026 10:02:00'})
      .addLine({barcode: '0001', name: 'Milk', price: 2, quantity: 1})
      .place();

    repository.save({order: cash})
      .flatMap(() => repository.save({order: card}))
      .flatMap(() => repository.save({order: plain}))
      .flatMap(() => repository.findById({id: 'cash'}))
      .flatMap(found => {
        expect(found.payment.method).to.equal('cash');
        expect(found.payment.tenderedCents).to.equal(2000);
        expect(found.payment.changeCents).to.equal(262);
        expect(found.total.cents).to.equal(1738);
        return repository.findById({id: 'card'});
      })
      .flatMap(found => {
        expect(found.payment.method).to.equal('card');
        expect(found.payment.tenderedCents).to.equal(200);
        expect(found.payment.changeCents).to.equal(0);
        return repository.findById({id: 'plain'});
      })
      .subscribe(
        found => {
          expect(found.payment).to.equal(null);
          const row = second.database.prepare(
            'SELECT payment_method, tendered_cents, change_cents FROM "order" WHERE id = ?'
          ).get('plain');
          expect(row.payment_method).to.equal(null);
          second.database.close();
        },
        error => {
          try { second.database.close(); } catch (closeError) { /* already closed */ }
          done(error);
        },
        () => done()
      );
  });

  it('round-trips print mode and the new JSON', done => {
    file = path.join(os.tmpdir(), `om-sell-pref-${Date.now()}-${process.pid}.sqlite`);
    const connection = new SqliteConnection({filename: file});
    const repository = new SqliteSellPreferencesRepository({connection});
    repository.findPreferences()
      .flatMap(preferences => {
        expect(preferences.printMode).to.equal('ask');
        expect(preferences.paperWidthMm).to.equal(80);
        return repository.save({
          preferences: preferences
            .withPrintMode('always')
            .withCopy({headerText: 'Hola', footerText: 'Adios'})
            .withPaperWidth(58)
        });
      })
      .flatMap(() => repository.findPreferences())
      .subscribe(
        preferences => {
          expect(preferences.printMode).to.equal('always');
          expect(preferences.headerText).to.equal('Hola');
          expect(preferences.footerText).to.equal('Adios');
          expect(preferences.paperWidthMm).to.equal(58);
          const row = connection.database.prepare(
            'SELECT value_json FROM setting WHERE key = ?'
          ).get('sell_auto_print');
          const json = JSON.parse(row.value_json);
          expect(json.printMode).to.equal('always');
          expect(json.headerText).to.equal('Hola');
          expect(json.footerText).to.equal('Adios');
          expect(json.paperWidthMm).to.equal(58);
          expect(json.autoPrint).to.equal(undefined);
          connection.database.close();
        },
        error => {
          try { connection.database.close(); } catch (closeError) { /* already closed */ }
          done(error);
        },
        () => done()
      );
  });
});
