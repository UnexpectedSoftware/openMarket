import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import {Container} from '../../../../openMarket/infrastructure/dic/Container';
import SqliteConnection from '../../../../openMarket/infrastructure/service/SqliteConnection';
import FixturesContainer from '../../../../openMarket/infrastructure/dev/FixturesContainer';
import FixturesService from '../../../../openMarket/infrastructure/dev/FixturesService';
import {electronUserDataDirectory, fixturesDatabasePath, main, runFixtures} from '../../../../openMarket/infrastructure/dev/fixtures';
import InvoiceIssued from '../../../../openMarket/domain/event/InvoiceIssued';
import OrderCreated from '../../../../openMarket/domain/event/OrderCreated';
import ProductWithLowStock from '../../../../openMarket/domain/event/ProductWithLowStock';
import Money from '../../../../openMarket/domain/money/Money';
import Quantity from '../../../../openMarket/domain/money/Quantity';
import Payment from '../../../../openMarket/domain/payment/Payment';
import runNow from '../../../../openMarket/infrastructure/service/runNow';
import * as demoCatalog from '../../../../openMarket/infrastructure/dev/demoCatalog';
import * as demoOrders from '../../../../openMarket/infrastructure/dev/demoOrders';
import * as demoSettings from '../../../../openMarket/infrastructure/dev/demoSettings';
import * as demoShop from '../../../../openMarket/infrastructure/dev/demoShop';

const NOW = new Date('2026-09-25T13:00:00Z');

/** The app's own container, opened on the file the fixtures script wrote. */
class AppContainer extends Container {
  constructor(filename) {
    super({environment: 'test'});
    this._filename = filename;
  }

  _sqliteConnection() {
    return new SqliteConnection({filename: this._filename});
  }
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
  return calls;
}

/** What the app does when it starts, after the plugin host. */
function startApp(container) {
  container.getInstance({key: 'recordProductSales'}).start();
  container.getInstance({key: 'domainEventDispatcher'}).dispatch();
  container.getInstance({key: 'domainEventBus'}).processPending();
}

function count(database, table) {
  return database.prepare('SELECT COUNT(*) AS total FROM ' + table).get().total;
}

function setting(database, key) {
  return JSON.parse(database.prepare('SELECT value_json FROM setting WHERE key = ?').get(key).value_json);
}

describe('npm run fixtures', function describeFixtures() {
  this.timeout(60000);

  const products = demoCatalog.buildProducts();
  const tickets = demoOrders.buildDemoOrders(products, NOW);
  const sold = demoOrders.soldQuantities(tickets);
  let directory;
  let filename;
  let summary;
  let app;
  let database;
  let plugin;

  before(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'om-fixtures-'));
    filename = path.join(directory, 'openmarket.sqlite');
    summary = runFixtures({filename, now: NOW});
    app = new AppContainer(filename);
    database = app.getInstance({key: 'sqliteConnection'}).database;
    plugin = fakePlugin(app);
    startApp(app);
  });

  after(() => {
    database.close();
    fs.rmSync(directory, {recursive: true, force: true});
  });

  it('reports what it wrote and how long it took', () => {
    expect(summary).to.include({filename, categories: 25, products: 100, orders: tickets.length});
    expect(summary.from).to.equal(tickets[0].at.toISOString());
    expect(summary.to).to.equal(tickets[tickets.length - 1].at.toISOString());
    expect(summary.ms).to.be.within(1, 30000);
  });

  it('writes the shop, the settings, the catalogue, and every sale through the use cases', () => {
    expect(setting(database, 'shop_profile')).to.include({tradeName: 'Ultramarinos La Plaza', invoicingEnabled: true});
    expect(setting(database, 'sell_auto_print')).to.include({printMode: 'ask', paperWidthMm: 80, templateId: 'classic-80'});
    expect(setting(database, 'printer')).to.include({type: 'epson', characterSet: 'SPAIN1'});
    expect(setting(database, 'appearance')).to.include({theme: 'mercado', layout: 'mostrador'});
    expect(setting(database, 'language')).to.include({locale: 'es'});
    expect(count(database, 'category')).to.equal(25);
    expect(count(database, 'product')).to.equal(100);
    expect(count(database, '"order"')).to.equal(tickets.length);
    expect(database.prepare('SELECT COUNT(*) AS total FROM product WHERE image_name IS NOT NULL').get().total).to.equal(6);
    expect(fs.readdirSync(path.join(directory, 'product-images'))).to.have.length(6);
  });

  it('dates each sale and numbers its invoice from 1 to N in time order', () => {
    const range = database.prepare('SELECT MIN(created_at) AS first, MAX(created_at) AS last FROM "order"').get();
    expect(range.first.slice(0, 10)).to.equal('2026-08-12');
    expect(range.last < '2026-09-25 15:00:00').to.equal(true);
    const invoices = database.prepare('SELECT number FROM invoice ORDER BY issued_at').all();
    expect(invoices.map(row => row.number)).to.deep.equal(tickets.map((ticket, index) => index + 1));
    expect(database.prepare('SELECT last_number FROM invoice_sequence WHERE series = ?').get('2026').last_number)
      .to.equal(tickets.length);
    expect(database.prepare('SELECT DISTINCT payment_method AS method FROM "order" ORDER BY method').all()
      .map(row => row.method)).to.deep.equal(['bizum', 'card', 'cash', 'mixed']);
  });

  it('ends each product on its closing stock, with low, out-of-stock, and disabled products', () => {
    const stored = new Map(database.prepare('SELECT barcode, stock, stock_min, status FROM product').all()
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
  });

  it('fills the sale statistics through the outbox, every row handled', () => {
    const totals = new Map(database.prepare('SELECT barcode, SUM(quantity) AS quantity FROM product_sale_day GROUP BY barcode')
      .all().map(row => [row.barcode, row.quantity]));
    sold.forEach((quantity, barcode) => expect(totals.get(barcode), barcode).to.be.closeTo(quantity.units, 1e-9));
    expect(count(database, 'product_sale_order')).to.equal(tickets.length);
    expect(database.prepare('SELECT COUNT(*) AS total FROM domain_event WHERE dispatched_at IS NULL').get().total).to.equal(0);
    expect(database.prepare(
      'SELECT subscriber_name AS name, status, COUNT(*) AS total FROM domain_event_processing GROUP BY name, status'
    ).all()).to.deep.equal([{name: 'record-product-sales', status: 'DONE', total: tickets.length}]);
  });

  it('gives a plugin nothing when the app starts on the demo shop, then delivers real sales', () => {
    expect(plugin).to.deep.equal({durable: [], sync: [], live: []});
    const price = Money.fromEuros('1.00');
    const barcode = products.find(product => product.enabled && product.closingStock > 10 && !product.weighted).barcode;
    runNow(app.getInstance({key: 'createOrderUseCase'}).createOrder({
      lines: [{barcode, name: 'Venta real', price, quantity: Quantity.from(1), weighted: false}],
      payment: Payment.card({total: price})
    }));
    expect(plugin.durable).to.deep.equal([tickets.length + 1]);
    expect(plugin.sync).to.have.length(1);
  });

  it('replays nothing to a plugin on the next start either', () => {
    const restarted = new AppContainer(filename);
    try {
      const returning = fakePlugin(restarted);
      startApp(restarted);
      expect(returning.durable).to.deep.equal([]);
    } finally {
      restarted.getInstance({key: 'sqliteConnection'}).database.close();
    }
  });
});

describe('npm run fixtures on a shop that already exists', function describeAgain() {
  this.timeout(60000);
  let directory;
  let filename;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'om-fixtures-'));
    filename = path.join(directory, 'openmarket.sqlite');
    runFixtures({filename, now: NOW});
  });

  afterEach(() => {
    fs.rmSync(directory, {recursive: true, force: true});
  });

  function read(query) {
    const database = new SqliteConnection({filename}).database;
    try {
      return database.prepare(query).get();
    } finally {
      database.close();
    }
  }

  it('replaces the shop instead of adding to it', () => {
    const again = runFixtures({filename, now: NOW});
    expect(read('SELECT COUNT(*) AS total FROM "order"').total).to.equal(again.orders);
    expect(read('SELECT COUNT(*) AS total FROM product_sale_order').total).to.equal(again.orders);
    expect(read('SELECT MAX(number) AS last FROM invoice').last).to.equal(again.orders);
  });

  it('rolls the whole run back when a step fails', () => {
    const products = demoCatalog.buildProducts();
    const broken = {...demoCatalog, buildProducts: () => products.map(product => product.enabled ? product : {...product, name: ' '})};
    const container = new FixturesContainer({filename});
    try {
      const service = new FixturesService({
        seed: container.getInstance({key: 'demoSeed'}),
        demoCatalog: broken,
        demoOrders,
        demoShop,
        demoSettings
      });
      expect(() => service.reset({now: NOW})).to.throw('Product name is missing');
      expect(container.getInstance({key: 'clock'}).now() > '2026-10-01').to.equal(true);
    } finally {
      container.close();
    }
    const orders = read('SELECT COUNT(*) AS total FROM "order"').total;
    expect(orders).to.be.above(1000);
    expect(read('SELECT COUNT(*) AS total FROM product').total).to.equal(100);
    expect(read('SELECT COUNT(*) AS total FROM invoice').total).to.equal(orders);
  });
});

describe('npm run fixtures entry point', () => {
  it('prints a summary and exits 0, or prints the failure and exits 1', function prints() {
    this.timeout(60000);
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'om-fixtures-'));
    const written = {out: '', err: ''};
    const out = {write: text => { written.out += text; }};
    const err = {write: text => { written.err += text; }};
    try {
      const blocker = path.join(directory, 'not-a-folder');
      fs.writeFileSync(blocker, '');
      expect(main({filename: path.join(blocker, 'openmarket.sqlite'), out, err, now: NOW})).to.equal(1);
      expect(written.err).to.contain('Demo shop not written to ' + path.join(blocker, 'openmarket.sqlite'));
      expect(written.out).to.equal('');

      expect(main({filename: path.join(directory, 'openmarket.sqlite'), out, err, now: NOW})).to.equal(0);
      expect(written.out).to.match(/^Demo shop written to .*openmarket\.sqlite\n  25 categories, 100 products, \d+ tickets and invoices\n  sales from 2026-08-12 to 2026-09-25, in \d+ ms\n$/);
    } finally {
      fs.rmSync(directory, {recursive: true, force: true});
    }
  });

  it('finds the database the dev app opens, unless OPENMARKET_USER_DATA points elsewhere', () => {
    const home = path.join('/', 'home', 'ana');
    expect(electronUserDataDirectory({platform: 'linux', env: {}, home})).to.equal(path.join(home, '.config', 'OpenMarket'));
    expect(electronUserDataDirectory({platform: 'linux', env: {XDG_CONFIG_HOME: '/xdg'}, home})).to.equal(path.join('/xdg', 'OpenMarket'));
    expect(electronUserDataDirectory({platform: 'darwin', env: {}, home}))
      .to.equal(path.join(home, 'Library', 'Application Support', 'OpenMarket'));
    expect(electronUserDataDirectory({platform: 'win32', env: {APPDATA: 'C:\\Roaming'}, home})).to.equal(path.join('C:\\Roaming', 'OpenMarket'));
    expect(electronUserDataDirectory({platform: 'win32', env: {}, home})).to.equal(path.join(home, 'AppData', 'Roaming', 'OpenMarket'));

    const previous = process.env.OPENMARKET_USER_DATA;
    try {
      process.env.OPENMARKET_USER_DATA = path.join(os.tmpdir(), 'om-data');
      expect(fixturesDatabasePath()).to.equal(path.join(os.tmpdir(), 'om-data', 'openmarket.sqlite'));
      delete process.env.OPENMARKET_USER_DATA;
      expect(fixturesDatabasePath()).to.equal(path.join(electronUserDataDirectory({
        platform: process.platform, env: process.env, home: os.homedir()
      }), 'openmarket.sqlite'));
    } finally {
      if (previous === undefined) {
        delete process.env.OPENMARKET_USER_DATA;
      } else {
        process.env.OPENMARKET_USER_DATA = previous;
      }
    }
  });
});
