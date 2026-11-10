import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import FixturesService from '../../../../openMarket/infrastructure/dev/FixturesService';
import * as demoCatalog from '../../../../openMarket/infrastructure/dev/demoCatalog';
import * as demoOrders from '../../../../openMarket/infrastructure/dev/demoOrders';
import * as demoSettings from '../../../../openMarket/infrastructure/dev/demoSettings';
import * as demoShop from '../../../../openMarket/infrastructure/dev/demoShop';

const category = {_id: '1', _name: 'Fruit'};
const product = {
  _barcode: '1001',
  _name: 'Apple',
  _description: '',
  _price: 1.2,
  _basePrice: 0.4,
  _stock: 3,
  _stockMin: 5,
  _weighted: false,
  _categoryId: '1',
  _status: 'ENABLED',
  _vatPercent: 4
};
const order = {
  _id: '1',
  _createdAt: '25/09/2026 12:00:00',
  _total: '1.20',
  _lines: [{barcode: '1001', name: 'Apple', price: 1.2, quantity: 1, vatPercent: 4}],
  _payment: {method: 'cash', tenderedCents: 200, changeCents: 80, parts: null},
  _invoice: {series: '2026', number: 1, invoiceNumber: '2026/000001'}
};

function withDevelopment(run) {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    return run();
  } finally {
    process.env.NODE_ENV = previous;
  }
}

function memory() {
  return new SqliteConnection({filename: ':memory:'}).database;
}

function count(database, table) {
  return database.prepare('SELECT COUNT(*) AS total FROM ' + table).get().total;
}

function setting(database, key) {
  const row = database.prepare('SELECT value_json FROM setting WHERE key = ?').get(key);
  return JSON.parse(row.value_json);
}

describe('FixturesService', function describeFixtures() {
  this.timeout(20000);

  it('does not seed an empty database', () => {
    const database = memory();
    const service = new FixturesService({
      database,
      demoCatalog: {buildCategories() { throw new Error('categories'); }},
      demoOrders: {buildDemoOrders() { throw new Error('orders'); }},
      demoShop: {buildProfile() { throw new Error('shop'); }},
      demoSettings: {buildSettings() { throw new Error('settings'); }}
    });
    withDevelopment(() => service.load());
    expect(count(database, 'category')).to.equal(0);
  });

  it('seeds when the one-shot flag was consumed, without appending on a second load', () => {
    const database = memory();
    const service = new FixturesService({
      database,
      demoCatalog: {
        buildCategories: () => [category],
        buildProducts: () => [product]
      },
      demoOrders: {buildDemoOrders: () => [order]},
      demoShop,
      demoSettings,
      resetOnLoad: true
    });
    withDevelopment(() => service.load());
    withDevelopment(() => service.load());
    expect(database.prepare('SELECT name FROM category').get().name).to.equal('Fruit');
    expect(count(database, '"order"')).to.equal(1);
    expect(count(database, 'invoice')).to.equal(1);
    expect(database.prepare('SELECT invoice_number FROM invoice').get().invoice_number).to.equal('2026/000001');
    expect(database.prepare('SELECT payment_method, change_cents FROM "order"').get()).to.deep.equal({
      payment_method: 'cash',
      change_cents: 80
    });
  });

  it('rolls the reset back when a write fails', () => {
    const database = memory();
    database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('keep', 'Kept');
    const directory = path.join(os.tmpdir(), 'om-demo-rollback-' + process.pid);
    const service = new FixturesService({
      database,
      imageDirectory: directory,
      demoCatalog: {
        buildCategories: () => [category],
        buildProducts: () => [product]
      },
      demoOrders: {
        buildDemoOrders: () => [{...order, _total: {}}]
      },
      demoShop,
      demoSettings
    });
    expect(() => withDevelopment(() => service.reset())).to.throw();
    expect(database.prepare('SELECT name FROM category').get().name).to.equal('Kept');
    expect(count(database, 'product')).to.equal(0);
    expect(count(database, '"order"')).to.equal(0);
    expect(fs.existsSync(directory)).to.equal(false);
  });

  it('does not reset outside development', () => {
    const database = memory();
    const service = serviceWith(database, null);
    service.reset();
    expect(count(database, 'category')).to.equal(0);
  });

  it('replaces the shop, the tickets, and the product images', () => {
    const database = memory();
    database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('old', 'Old');
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'om-demo-'));
    const now = new Date(2026, 8, 25, 15, 0, 0);
    try {
      const service = serviceWith(database, directory);
      withDevelopment(() => service.reset({now}));
      expect(database.prepare("SELECT id FROM category WHERE id = 'old'").get()).to.equal(undefined);
      expect(count(database, 'category')).to.equal(25);
      expect(count(database, 'product')).to.equal(100);
      expect(vats(database)).to.deep.equal([4, 10, 21]);
      expect(methods(database)).to.deep.equal(['bizum', 'card', 'cash', 'mixed']);
      expect(setting(database, 'shop_profile').tradeName).to.equal('Ultramarinos La Plaza');
      expect(setting(database, 'sell_auto_print').printMode).to.equal('ask');
      expect(setting(database, 'sell_auto_print').templateId).to.equal('classic-80');
      expect(setting(database, 'printer').type).to.equal('epson');
      expect(setting(database, 'appearance')).to.deep.equal({theme: 'mercado', layout: 'mostrador'});
      expect(setting(database, 'language').locale).to.equal('es');

      const weighed = database.prepare(
        'SELECT quantity_milli AS milli FROM invoice_line WHERE weighted = 1 AND quantity_milli % 1000 != 0 LIMIT 1'
      ).get();
      expect(weighed.milli % 1000).to.not.equal(0);
      const cash = database.prepare(
        "SELECT change_cents FROM \"order\" WHERE payment_method = 'cash' LIMIT 1"
      ).get();
      expect(cash.change_cents).to.be.above(0);
      const mixed = database.prepare(
        "SELECT total_cents, payment_parts FROM \"order\" WHERE payment_method = 'mixed' LIMIT 1"
      ).get();
      const parts = JSON.parse(mixed.payment_parts);
      expect(parts[0].amountCents + parts[1].amountCents).to.equal(mixed.total_cents);

      const invoices = database.prepare(
        'SELECT series, number, invoice_number FROM invoice ORDER BY series, number'
      ).all();
      expect(invoices).to.have.length(count(database, '"order"'));
      let previous = 0;
      invoices.forEach(row => {
        expect(row.number).to.equal(previous + 1);
        expect(row.invoice_number).to.equal(row.series + '/' + String(row.number).padStart(6, '0'));
        previous = row.number;
      });
      expect(database.prepare('SELECT last_number FROM invoice_sequence').get().last_number).to.equal(previous);
      expect(database.prepare('SELECT issuer_json FROM invoice LIMIT 1').get().issuer_json)
        .to.include('Ultramarinos La Plaza');
      expect(count(database, 'product_sale_day')).to.equal(0);
      expect(count(database, 'domain_event')).to.equal(0);
      expect(count(database, 'plugin_state')).to.equal(0);

      const files = fs.readdirSync(directory);
      expect(files).to.have.length(6);
      expect(files.every(file => file.endsWith('.png'))).to.equal(true);

      database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('later', 'Later');
      withDevelopment(() => service.reset({now}));
      expect(database.prepare("SELECT id FROM category WHERE id = 'later'").get()).to.equal(undefined);
      expect(count(database, 'invoice')).to.equal(invoices.length);
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });
});

function serviceWith(database, directory) {
  return new FixturesService({
    database,
    demoCatalog,
    demoOrders,
    demoShop,
    demoSettings,
    imageDirectory: directory
  });
}

function vats(database) {
  return database.prepare('SELECT DISTINCT vat_percent AS vat FROM product').all()
    .map(row => row.vat)
    .sort((left, right) => left - right);
}

function methods(database) {
  return database.prepare('SELECT DISTINCT payment_method AS method FROM "order"').all()
    .map(row => row.method)
    .sort();
}
