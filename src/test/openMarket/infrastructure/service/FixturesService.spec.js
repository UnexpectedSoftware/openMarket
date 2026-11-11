import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import {Container} from '../../../../openMarket/infrastructure/dic/Container';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import SettableClock from '../../../../openMarket/infrastructure/service/SettableClock';
import ImageStore from '../../../../openMarket/infrastructure/service/ImageStore';
import FixturesService from '../../../../openMarket/infrastructure/dev/FixturesService';
import InvoiceIssued from '../../../../openMarket/domain/event/InvoiceIssued';
import OrderCreated from '../../../../openMarket/domain/event/OrderCreated';
import ProductWithLowStock from '../../../../openMarket/domain/event/ProductWithLowStock';
import SeedableDomainEventSubscribers from '../../../../openMarket/infrastructure/event/SeedableDomainEventSubscribers';
import Money from '../../../../openMarket/domain/money/Money';
import Quantity from '../../../../openMarket/domain/money/Quantity';
import Payment from '../../../../openMarket/domain/payment/Payment';
import runNow from '../../../../openMarket/infrastructure/service/runNow';
import * as demoCatalog from '../../../../openMarket/infrastructure/dev/demoCatalog';
import * as demoOrders from '../../../../openMarket/infrastructure/dev/demoOrders';
import * as demoSettings from '../../../../openMarket/infrastructure/dev/demoSettings';
import * as demoShop from '../../../../openMarket/infrastructure/dev/demoShop';

const NOW = new Date('2026-09-25T13:00:00Z');

/**
 * The real container with the development clock and subscriber set, on a database
 * file (or in memory), with product photos in a temporary folder.
 */
class SeedContainer extends Container {
  constructor(imageDirectory, filename = ':memory:') {
    super({environment: 'test'});
    this._imageDirectory = imageDirectory;
    this._filename = filename;
  }

  _sqliteConnection() {
    return new SqliteConnection({filename: this._filename});
  }

  _clock() {
    return new SettableClock();
  }

  _domainEventSubscribers() {
    return new SeedableDomainEventSubscribers();
  }

  _productImageStore() {
    return new ImageStore({directory: this._imageDirectory});
  }
}

function withDevelopment(run) {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    return run();
  } finally {
    process.env.NODE_ENV = previous;
  }
}

function seeded(overrides = {}, filename = ':memory:') {
  const imageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'om-demo-store-'));
  const container = new SeedContainer(imageDirectory, filename);
  const database = container.getInstance({key: 'sqliteConnection'}).database;
  const service = new FixturesService({
    database,
    seed: () => container.getInstance({key: 'demoSeed'}),
    demoCatalog,
    demoOrders,
    demoShop,
    demoSettings,
    ...overrides
  });
  return {container, database, service, imageDirectory};
}

/**
 * A plugin that would submit invoices, check sales inside the transaction, and toast.
 * @param {Container} container
 */
function fakePlugin(container) {
  const bus = container.getInstance({key: 'domainEventBus'});
  const calls = {durable: [], sync: [], live: []};
  bus.subscribeDurable('verifactu:submit', InvoiceIssued, event => calls.durable.push(event.number));
  bus.subscribeSync(OrderCreated, event => calls.sync.push(event.id));
  bus.ofType(ProductWithLowStock).subscribe(event => calls.live.push(event));
  return {calls};
}

function count(database, table) {
  return database.prepare('SELECT COUNT(*) AS total FROM ' + table).get().total;
}

function setting(database, key) {
  const row = database.prepare('SELECT value_json FROM setting WHERE key = ?').get(key);
  return JSON.parse(row.value_json);
}

describe('FixturesService', function describeFixtures() {
  this.timeout(60000);

  const products = demoCatalog.buildProducts();
  const tickets = demoOrders.buildDemoOrders(products, NOW);
  const sold = demoOrders.soldQuantities(tickets);
  let shop;
  let plugin;
  let elapsedMs;
  let databaseDirectory;

  before(() => {
    databaseDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'om-demo-db-'));
    shop = seeded({}, path.join(databaseDirectory, 'shop.db'));
    shop.container.getInstance({key: 'recordProductSales'}).start();
    plugin = fakePlugin(shop.container);
    const started = Date.now();
    withDevelopment(() => shop.service.reset({now: NOW}));
    elapsedMs = Date.now() - started;
  });

  after(() => {
    fs.rmSync(shop.imageDirectory, {recursive: true, force: true});
    fs.rmSync(databaseDirectory, {recursive: true, force: true});
  });

  it('replays the shop, the settings, the catalogue, and every sale through the use cases', () => {
    const {database} = shop;
    expect(setting(database, 'shop_profile')).to.include({tradeName: 'Ultramarinos La Plaza', invoicingEnabled: true});
    expect(setting(database, 'sell_auto_print')).to.include({printMode: 'ask', paperWidthMm: 80, templateId: 'classic-80'});
    expect(setting(database, 'printer')).to.include({type: 'epson', characterSet: 'SPAIN1'});
    expect(setting(database, 'appearance')).to.include({theme: 'mercado', layout: 'mostrador'});
    expect(setting(database, 'language')).to.include({locale: 'es'});
    expect(count(database, 'category')).to.equal(25);
    expect(count(database, 'product')).to.equal(100);
    expect(count(database, '"order"')).to.equal(tickets.length);
    expect(count(database, 'invoice')).to.equal(tickets.length);
    expect(database.prepare('SELECT COUNT(*) AS total FROM product WHERE image_name IS NOT NULL').get().total).to.equal(6);
    expect(fs.readdirSync(shop.imageDirectory)).to.have.length(6);
    expect(elapsedMs).to.be.below(30000);
  });

  it('dates each sale and its invoice at the ticket time and numbers the invoices in order', () => {
    const {database} = shop;
    const first = database.prepare('SELECT MIN(created_at) AS first, MAX(created_at) AS last FROM "order"').get();
    expect(first.first.slice(0, 10)).to.equal('2026-08-12');
    expect(first.last < '2026-09-25 15:00:00').to.equal(true);
    const invoices = database.prepare('SELECT number, issue_date, issued_at FROM invoice ORDER BY issued_at').all();
    expect(invoices.map(row => row.number)).to.deep.equal(invoices.map((row, index) => index + 1));
    expect(invoices[0].issue_date).to.equal('2026-08-12');
    expect(database.prepare('SELECT last_number FROM invoice_sequence WHERE series = ?').get('2026').last_number)
      .to.equal(tickets.length);
    expect(database.prepare('SELECT DISTINCT payment_method AS method FROM "order" ORDER BY method').all()
      .map(row => row.method)).to.deep.equal(['bizum', 'card', 'cash', 'mixed']);
  });

  it('ends each product on its closing stock, with low, out-of-stock, and disabled products', () => {
    const stored = new Map(shop.database.prepare('SELECT barcode, stock, stock_min, status FROM product').all()
      .map(row => [row.barcode, row]));
    products.forEach(product => {
      expect(stored.get(product.barcode).stock, product.name).to.be.closeTo(product.closingStock, 1e-9);
    });
    const enabled = [...stored.values()].filter(row => row.status === 'ENABLED');
    expect(enabled.filter(row => Math.abs(row.stock) < 1e-9).map(row => row.barcode).sort())
      .to.deep.equal(['8410000001004', '8410000001014', '8410000001067', '8410000001079']);
    const low = products.filter(product => product.enabled && product.closingStock > 0 && product.closingStock < product.stockMin);
    expect(low).to.have.length(8);
    expect(enabled.filter(row => row.stock > 1e-9 && row.stock < row.stock_min).map(row => row.barcode).sort())
      .to.deep.equal(low.map(product => product.barcode).sort());
    expect([...stored.values()].filter(row => row.status === 'DISABLED').map(row => row.barcode).sort())
      .to.deep.equal(['8410000001057', '8410000001081', '8410000001089', '8410000001094']);
    expect(sold.get('8410000001004').milli).to.be.above(0);
  });

  it('runs the sale statistics after the commit on the normal bus', () => {
    const {database} = shop;
    const totals = new Map(database.prepare('SELECT barcode, SUM(quantity) AS quantity FROM product_sale_day GROUP BY barcode')
      .all().map(row => [row.barcode, row.quantity]));
    sold.forEach((quantity, barcode) => expect(totals.get(barcode), barcode).to.be.closeTo(quantity.units, 1e-9));
    expect(count(database, 'product_sale_order')).to.equal(tickets.length);
    expect(database.prepare("SELECT COUNT(*) AS total FROM domain_event WHERE dispatched_at IS NULL").get().total).to.equal(0);
  });

  it('records every demo invoice as handled for a running plugin without calling it', () => {
    expect(plugin.calls).to.deep.equal({durable: [], sync: [], live: []});
    expect(shop.database.prepare(
      'SELECT subscriber_name AS name, status, COUNT(*) AS total FROM domain_event_processing GROUP BY name, status ORDER BY name'
    ).all()).to.deep.equal([
      {name: 'record-product-sales', status: 'DONE', total: tickets.length},
      {name: 'verifactu:submit', status: 'DONE', total: tickets.length}
    ]);
  });

  it('replays no demo invoice to plugins on the next start', () => {
    const restarted = new SeedContainer(shop.imageDirectory, path.join(databaseDirectory, 'shop.db'));
    const returning = fakePlugin(restarted);
    const newcomer = [];
    const bus = restarted.getInstance({key: 'domainEventBus'});
    bus.subscribeDurable('newcomer:submit', InvoiceIssued, event => newcomer.push(event));
    restarted.getInstance({key: 'recordProductSales'}).start();
    restarted.getInstance({key: 'domainEventDispatcher'}).dispatch();
    bus.processPending();
    expect(returning.calls.durable).to.deep.equal([]);
    expect(newcomer).to.deep.equal([]);
    restarted.getInstance({key: 'sqliteConnection'}).database.close();
  });

  it('hands the real plugin back its handlers once the seed is over', () => {
    const price = Money.fromEuros('1.00');
    const fresh = seeded();
    try {
      const live = fakePlugin(fresh.container);
      withDevelopment(() => fresh.service.reset({now: NOW}));
      expect(live.calls).to.deep.equal({durable: [], sync: [], live: []});
      const barcode = products.find(product => product.enabled && product.closingStock > 10 && !product.weighted).barcode;
      runNow(fresh.container.getInstance({key: 'createOrderUseCase'}).createOrder({
        lines: [{barcode, name: 'Venta real', price, quantity: Quantity.from(1), weighted: false}],
        payment: Payment.card({total: price})
      }));
      expect(live.calls.durable).to.deep.equal([tickets.length + 1]);
      expect(live.calls.sync).to.have.length(1);
    } finally {
      fs.rmSync(fresh.imageDirectory, {recursive: true, force: true});
    }
  });

  it('replays the same shop on a second reset', () => {
    withDevelopment(() => shop.service.reset({now: NOW}));
    expect(count(shop.database, 'product')).to.equal(100);
    expect(count(shop.database, '"order"')).to.equal(tickets.length);
    expect(count(shop.database, 'product_sale_order')).to.equal(tickets.length);
  });

  it('rolls the whole reset back when a step fails', () => {
    const broken = {
      ...demoCatalog,
      buildProducts: () => products.map(product => product.enabled ? product : {...product, name: ' '})
    };
    const shopToKeep = seeded();
    const failing = new FixturesService({
      database: shopToKeep.database,
      seed: () => shopToKeep.container.getInstance({key: 'demoSeed'}),
      demoCatalog: broken,
      demoOrders,
      demoShop,
      demoSettings
    });
    try {
      withDevelopment(() => shopToKeep.service.reset({now: NOW}));
      expect(() => withDevelopment(() => failing.reset({now: NOW}))).to.throw('Product name is missing');
      expect(count(shopToKeep.database, 'product')).to.equal(100);
      expect(count(shopToKeep.database, '"order"')).to.equal(tickets.length);
      expect(count(shopToKeep.database, 'invoice')).to.equal(tickets.length);
    } finally {
      fs.rmSync(shopToKeep.imageDirectory, {recursive: true, force: true});
    }
  });

  it('gives plugins that start after a reset on load no demo invoice', () => {
    const launched = seeded({resetOnLoad: true});
    try {
      withDevelopment(() => launched.service.load());
      const later = fakePlugin(launched.container);
      launched.container.getInstance({key: 'domainEventDispatcher'}).dispatch();
      launched.container.getInstance({key: 'domainEventBus'}).processPending();
      expect(later.calls.durable).to.deep.equal([]);
      expect(count(launched.database, 'product_sale_order')).to.equal(count(launched.database, '"order"'));
    } finally {
      fs.rmSync(launched.imageDirectory, {recursive: true, force: true});
    }
  });

  it('does nothing outside development, on a plain load, or without the demo builders', () => {
    const idle = seeded();
    try {
      idle.service.reset({now: NOW});
      withDevelopment(() => idle.service.load());
      withDevelopment(() => new FixturesService({database: idle.database}).reset({now: NOW}));
      expect(count(idle.database, 'category')).to.equal(0);
      const once = seeded({resetOnLoad: true});
      withDevelopment(() => once.service.load());
      expect(count(once.database, 'category')).to.equal(25);
      fs.rmSync(once.imageDirectory, {recursive: true, force: true});
    } finally {
      fs.rmSync(idle.imageDirectory, {recursive: true, force: true});
    }
  });
});
