import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import {replaceSqliteData} from '../openMarket/infrastructure/service/sqliteSeed';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteDomainEventStore from '../openMarket/infrastructure/service/SqliteDomainEventStore';
import SqliteTransaction from '../openMarket/infrastructure/service/SqliteTransaction';
import DomainEventBus from '../openMarket/domain/service/DomainEventBus';
import OrderCreated from '../openMarket/domain/event/OrderCreated';
import ProductEnabledAgain from '../openMarket/domain/event/ProductEnabledAgain';
import ProductWithLowStock from '../openMarket/domain/event/ProductWithLowStock';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const domainEventBus = openMarket.get('domain_event_bus');
const createOrder = openMarket.get('orders_create_use_case');
const enableProduct = openMarket.get('products_enable_use_case');

const product = {
  _id: 'Seq-0',
  _barcode: '0001',
  _name: 'Coca-Cola',
  _description: '',
  _price: 0.55,
  _basePrice: 0.3,
  _stock: 100,
  _stockMin: 10,
  _imageUrl: 'a',
  _categoryId: '1',
  _status: 'ENABLED'
};

function count(sql) {
  return Number(database.prepare(sql).get().total);
}

function storedEvents() {
  return database.prepare(
    'SELECT type, payload, aggregate_id AS aggregateId, created_at AS createdAt ' +
    'FROM domain_event ORDER BY rowid ASC'
  ).all();
}

function processingRows() {
  return database.prepare(
    'SELECT e.aggregate_id AS aggregateId, e.type AS type, p.status AS status, ' +
    'p.attempts AS attempts, p.last_error AS lastError, p.subscriber_name AS subscriberName ' +
    'FROM domain_event_processing p INNER JOIN domain_event e ON e.id = p.event_id ' +
    'ORDER BY e.rowid ASC, p.subscriber_name ASC'
  ).all().map(row => ({
    aggregateId: row.aggregateId,
    type: row.type,
    status: row.status,
    attempts: Number(row.attempts),
    lastError: row.lastError,
    subscriberName: row.subscriberName
  }));
}

function sale(createdAt) {
  return new OrderCreated({
    id: 'sale-' + createdAt,
    createdAt,
    lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}]
  });
}

function openBus(filename) {
  const connection = new SqliteConnection({filename});
  const bus = new DomainEventBus({
    store: new SqliteDomainEventStore({connection}),
    intervalMs: 60000
  });
  return {connection, database: connection.database, bus};
}

function temporaryDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-events-'));
}

describe('Domain event bus', () => {
  const subscriptions = [];

  function unsubscribeLater(subscription) {
    subscriptions.push(() => {
      if (typeof subscription === 'function') {
        subscription();
        return;
      }
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });
  }

  afterEach(() => {
    while (subscriptions.length > 0) {
      subscriptions.pop()();
    }
  });

  describe('when a sale is published inside its transaction', () => {
    beforeEach(() => {
      replaceSqliteData(database, {products: [product]});
    });

    it('records the event and runs synchronous and durable subscribers', () => {
      const sync = [];
      const live = [];
      const durable = [];
      unsubscribeLater(domainEventBus.subscribeSync('audit', OrderCreated, event => {
        sync.push({open: database.isTransaction, id: event.id});
        database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('from-sync', event.id);
      }));
      unsubscribeLater(domainEventBus.subscribeDurable('plugin', OrderCreated, event => {
        durable.push({
          open: database.isTransaction,
          id: event.id,
          lines: event.lines
        });
      }));
      unsubscribeLater(domainEventBus.ofType(OrderCreated).subscribe(() => {
        live.push(database.isTransaction);
      }));
      const lines = [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 5}];
      let order = null;
      let failure = null;

      createOrder.createOrder({lines}).subscribe(
        saved => {
          order = saved;
        },
        error => {
          failure = error;
        }
      );

      expect(failure).to.equal(null);
      expect(sync).to.deep.equal([{open: true, id: order.id}]);
      expect(live).to.deep.equal([false]);
      expect(durable).to.deep.equal([{
        open: false,
        id: order.id,
        lines
      }]);
      expect(database.prepare('SELECT name FROM category WHERE id = ?').get('from-sync').name).to.equal(order.id);
      expect(Number(database.prepare('SELECT stock FROM product WHERE barcode = ?').get('0001').stock)).to.equal(95);
      const rows = storedEvents();
      expect(rows).to.have.lengthOf(1);
      expect(rows[0].type).to.equal('OrderCreated');
      expect(rows[0].aggregateId).to.equal(order.id);
      expect(rows[0].createdAt).to.match(/^\d{4}-\d{2}-\d{2}T/);
      expect(JSON.parse(rows[0].payload).createdAt).to.equal(order.createdAt);
      expect(JSON.parse(rows[0].payload).lines).to.deep.equal(lines);
      expect(processingRows()).to.deep.equal([{
        aggregateId: order.id,
        type: 'OrderCreated',
        status: 'DONE',
        attempts: 1,
        lastError: null,
        subscriberName: 'plugin'
      }]);
      expect(database.isTransaction).to.equal(false);
    });

    it('rolls the sale, the event, and the synchronous write back when a handler throws', () => {
      const live = [];
      unsubscribeLater(domainEventBus.ofType(OrderCreated).subscribe(() => live.push('order')));
      unsubscribeLater(domainEventBus.ofType(ProductWithLowStock).subscribe(() => live.push('low')));
      unsubscribeLater(domainEventBus.subscribeSync('guard', OrderCreated, () => {
        database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('from-sync', 'no');
        throw new Error('sync failed');
      }));
      const lines = [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 5}];
      let failure = null;
      let emitted = false;

      createOrder.createOrder({lines}).subscribe(
        () => {
          emitted = true;
        },
        error => {
          failure = error;
        }
      );

      expect(emitted).to.equal(false);
      expect(failure).to.be.instanceof(Error);
      expect(failure.message).to.equal('sync failed');
      expect(count('SELECT count(*) AS total FROM "order"')).to.equal(0);
      expect(count('SELECT count(*) AS total FROM line')).to.equal(0);
      expect(Number(database.prepare('SELECT stock FROM product WHERE barcode = ?').get('0001').stock)).to.equal(100);
      expect(count('SELECT count(*) AS total FROM domain_event')).to.equal(0);
      expect(count('SELECT count(*) AS total FROM domain_event_processing')).to.equal(0);
      expect(database.prepare('SELECT id FROM category WHERE id = ?').get('from-sync')).to.equal(undefined);
      expect(live).to.deep.equal([]);
      expect(database.isTransaction).to.equal(false);
    });

    it('rolls back an earlier event in the same sale when a later synchronous handler throws', () => {
      unsubscribeLater(domainEventBus.subscribeSync('block-low-stock', ProductWithLowStock, () => {
        throw new Error('sync failed');
      }));
      const lines = [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 90}];
      let failure = null;

      createOrder.createOrder({lines}).subscribe(
        () => {
          failure = new Error('emitted');
        },
        error => {
          failure = error;
        }
      );

      expect(failure.message).to.equal('sync failed');
      expect(count('SELECT count(*) AS total FROM "order"')).to.equal(0);
      expect(Number(database.prepare('SELECT stock FROM product WHERE barcode = ?').get('0001').stock)).to.equal(100);
      expect(count('SELECT count(*) AS total FROM domain_event')).to.equal(0);
      expect(database.isTransaction).to.equal(false);
    });

    it('records ProductWithLowStock beside OrderCreated', () => {
      const durable = [];
      unsubscribeLater(domainEventBus.subscribeDurable('stock', ProductWithLowStock, event => {
        durable.push({barcode: event.barcode, stock: event.stock, stockMin: event.stockMin});
      }));
      const lines = [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 90}];
      let failure = null;

      createOrder.createOrder({lines}).subscribe(
        () => {},
        error => {
          failure = error;
        }
      );

      expect(failure).to.equal(null);
      expect(storedEvents().map(row => row.type)).to.deep.equal(['OrderCreated', 'ProductWithLowStock']);
      expect(durable).to.deep.equal([{barcode: '0001', stock: 10, stockMin: 10}]);
      const stockRow = processingRows().find(row => row.type === 'ProductWithLowStock');
      expect(stockRow.status).to.equal('DONE');
      expect(stockRow.attempts).to.equal(1);
      expect(stockRow.aggregateId).to.equal('0001');
    });
  });

  describe('when a product is enabled outside the sale transaction', () => {
    beforeEach(() => {
      replaceSqliteData(database, {
        products: [{
          ...product,
          _barcode: '0005',
          _name: 'Coca-Cola Zero 42',
          _stock: 10,
          _status: 'DISABLED'
        }]
      });
    });

    it('records ProductEnabledAgain and notifies live listeners', () => {
      const live = [];
      unsubscribeLater(domainEventBus.ofType(ProductEnabledAgain).subscribe(event => {
        live.push({open: database.isTransaction, barcode: event.barcode, name: event.name});
      }));
      let failure = null;

      enableProduct.enableForSale({barcode: '0005'}).subscribe(
        () => {},
        error => {
          failure = error;
        }
      );

      expect(failure).to.equal(null);
      expect(live).to.deep.equal([{open: false, barcode: '0005', name: 'Coca-Cola Zero 42'}]);
      const rows = storedEvents();
      expect(rows).to.have.lengthOf(1);
      expect(rows[0].type).to.equal('ProductEnabledAgain');
      expect(rows[0].aggregateId).to.equal('0005');
      expect(JSON.parse(rows[0].payload)).to.deep.equal({barcode: '0005', name: 'Coca-Cola Zero 42'});
      expect(count('SELECT count(*) AS total FROM domain_event_processing')).to.equal(0);
    });
  });
});

describe('Domain event store', () => {
  let directory;

  afterEach(() => {
    if (directory) {
      fs.rmSync(directory, {recursive: true, force: true});
      directory = null;
    }
  });

  function rows(db) {
    return db.prepare(
      'SELECT e.aggregate_id AS aggregateId, p.status AS status, p.attempts AS attempts, p.last_error AS lastError ' +
      'FROM domain_event_processing p INNER JOIN domain_event e ON e.id = p.event_id ORDER BY e.rowid ASC'
    ).all().map(row => ({
      aggregateId: row.aggregateId,
      status: row.status,
      attempts: Number(row.attempts),
      lastError: row.lastError
    }));
  }

  it('propagates a synchronous throw from inside the work observable and rolls the write back', () => {
    directory = temporaryDirectory();
    const opened = openBus(path.join(directory, 'events.sqlite'));
    const transaction = new SqliteTransaction({
      connection: opened.connection,
      domainEventBus: opened.bus
    });
    const live = [];
    opened.bus.ofType(OrderCreated).subscribe(() => live.push(opened.database.isTransaction));
    opened.bus.subscribeSync('guard', OrderCreated, () => {
      opened.database.prepare("INSERT INTO category (id, name) VALUES ('from-sync', 'yes')").run();
      throw new Error('sync failed');
    });
    let failure = null;

    try {
      transaction.run(() => Rx.Observable.of('sale').do(() => {
        opened.database.prepare("INSERT INTO category (id, name) VALUES ('from-work', 'yes')").run();
        opened.bus.publish(sale('02/07/2017 10:00:00'));
      })).subscribe(
        () => {
          failure = new Error('emitted');
        },
        error => {
          failure = error;
        }
      );

      expect(failure).to.be.instanceof(Error);
      expect(failure.message).to.equal('sync failed');
      expect(opened.database.isTransaction).to.equal(false);
      expect(Number(opened.database.prepare('SELECT count(*) AS total FROM category').get().total)).to.equal(0);
      expect(Number(opened.database.prepare('SELECT count(*) AS total FROM domain_event').get().total)).to.equal(0);
      expect(Number(opened.database.prepare('SELECT count(*) AS total FROM domain_event_processing').get().total)).to.equal(0);
      expect(live).to.deep.equal([]);
    } finally {
      opened.bus.stop();
      opened.database.close();
    }
  });

  it('propagates a synchronous throw from the work function itself', () => {
    directory = temporaryDirectory();
    const opened = openBus(path.join(directory, 'events.sqlite'));
    const transaction = new SqliteTransaction({
      connection: opened.connection,
      domainEventBus: opened.bus
    });
    opened.bus.subscribeSync('guard', OrderCreated, () => {
      throw new Error('sync failed');
    });
    let failure = null;

    try {
      transaction.run(() => {
        opened.database.prepare("INSERT INTO category (id, name) VALUES ('from-work', 'yes')").run();
        opened.bus.publish(sale('02/07/2017 10:00:00'));
        return Rx.Observable.of('sale');
      }).subscribe(
        () => {
          failure = new Error('emitted');
        },
        error => {
          failure = error;
        }
      );

      expect(failure.message).to.equal('sync failed');
      expect(Number(opened.database.prepare('SELECT count(*) AS total FROM category').get().total)).to.equal(0);
      expect(Number(opened.database.prepare('SELECT count(*) AS total FROM domain_event').get().total)).to.equal(0);
      expect(opened.database.isTransaction).to.equal(false);
    } finally {
      opened.bus.stop();
      opened.database.close();
    }
  });

  it('keeps the synchronous write and calls the durable subscriber after commit', () => {
    directory = temporaryDirectory();
    const opened = openBus(path.join(directory, 'events.sqlite'));
    const transaction = new SqliteTransaction({
      connection: opened.connection,
      domainEventBus: opened.bus
    });
    const seen = {sync: [], live: [], durable: []};
    opened.bus.subscribeSync('audit', OrderCreated, event => {
      seen.sync.push(opened.database.isTransaction);
      opened.database.prepare('INSERT INTO category (id, name) VALUES (?, ?)').run('from-sync', event.id);
    });
    opened.bus.subscribeDurable('plugin', OrderCreated, event => {
      seen.durable.push({open: opened.database.isTransaction, id: event.id, type: event.constructor.type});
    });
    opened.bus.ofType(OrderCreated).subscribe(() => {
      seen.live.push(opened.database.isTransaction);
    });
    let failure = null;

    try {
      transaction.run(() => {
        opened.database.prepare("INSERT INTO category (id, name) VALUES ('from-work', 'yes')").run();
        return Rx.Observable.of('sale').do(() => {
          opened.bus.publish(sale('02/07/2017 10:00:00'));
        });
      }).subscribe(
        () => {},
        error => {
          failure = error;
        }
      );

      expect(failure).to.equal(null);
      expect(seen.sync).to.deep.equal([true]);
      expect(seen.live).to.deep.equal([false]);
      expect(seen.durable).to.deep.equal([{open: false, id: 'sale-02/07/2017 10:00:00', type: 'OrderCreated'}]);
      const names = opened.database.prepare('SELECT id FROM category ORDER BY id').all().map(row => row.id);
      expect(names).to.deep.equal(['from-sync', 'from-work']);
      expect(rows(opened.database)).to.deep.equal([{
        aggregateId: 'sale-02/07/2017 10:00:00',
        status: 'DONE',
        attempts: 1,
        lastError: null
      }]);
    } finally {
      opened.bus.stop();
      opened.database.close();
    }
  });

  it('retries a durable subscriber and then dead-letters it', () => {
    directory = temporaryDirectory();
    const opened = openBus(path.join(directory, 'events.sqlite'));
    let calls = 0;
    opened.bus.subscribeDurable('plugin', OrderCreated, () => {
      calls += 1;
      throw new Error('not yet');
    }, {maxAttempts: 2});

    try {
      opened.bus.publish(sale('02/07/2017 10:00:00'));
      expect(calls).to.equal(1);
      expect(rows(opened.database)).to.deep.equal([{
        aggregateId: 'sale-02/07/2017 10:00:00',
        status: 'FAILED',
        attempts: 1,
        lastError: 'not yet'
      }]);

      opened.bus.processPending();

      expect(calls).to.equal(2);
      expect(rows(opened.database)[0].status).to.equal('DEAD');
      expect(rows(opened.database)[0].attempts).to.equal(2);
      expect(rows(opened.database)[0].lastError).to.equal('not yet');

      opened.bus.processPending();

      expect(calls).to.equal(2);
    } finally {
      opened.bus.stop();
      opened.database.close();
    }
  });

  it('holds later events until an ordered subscriber succeeds', () => {
    directory = temporaryDirectory();
    const opened = openBus(path.join(directory, 'events.sqlite'));
    const seen = [];
    let block = true;
    opened.bus.subscribeDurable('ordered', OrderCreated, event => {
      seen.push(event.id);
      if (event.id === 'sale-a' && block) {
        throw new Error('block');
      }
    }, {ordered: true, maxAttempts: 5});

    try {
      opened.bus.publish(new OrderCreated({id: 'sale-a', createdAt: '02/07/2017 10:00:00', lines: []}));
      opened.bus.publish(new OrderCreated({id: 'sale-b', createdAt: '02/07/2017 10:00:01', lines: []}));
      expect(seen).to.deep.equal(['sale-a']);
      expect(rows(opened.database).map(row => row.status)).to.deep.equal(['FAILED', 'PENDING']);

      opened.bus.processPending();
      expect(seen).to.deep.equal(['sale-a', 'sale-a']);

      block = false;
      opened.bus.processPending();
      expect(seen).to.deep.equal(['sale-a', 'sale-a', 'sale-a', 'sale-b']);
      expect(rows(opened.database).map(row => row.status)).to.deep.equal(['DONE', 'DONE']);
    } finally {
      opened.bus.stop();
      opened.database.close();
    }
  });

  it('delivers a later event while an unordered subscriber is still failing', () => {
    directory = temporaryDirectory();
    const opened = openBus(path.join(directory, 'events.sqlite'));
    const seen = [];
    opened.bus.subscribeDurable('free', OrderCreated, event => {
      seen.push(event.id);
      if (event.id === 'sale-a') {
        throw new Error('block');
      }
    }, {ordered: false, maxAttempts: 3});

    try {
      opened.bus.publish(new OrderCreated({id: 'sale-a', createdAt: '02/07/2017 10:00:00', lines: []}));
      opened.bus.publish(new OrderCreated({id: 'sale-b', createdAt: '02/07/2017 10:00:01', lines: []}));
      expect(seen).to.deep.equal(['sale-a', 'sale-b']);
      expect(rows(opened.database).map(row => [row.aggregateId, row.status])).to.deep.equal([
        ['sale-a', 'FAILED'],
        ['sale-b', 'DONE']
      ]);
    } finally {
      opened.bus.stop();
      opened.database.close();
    }
  });

  it('delivers a failed event again after a new bus opens the same file', () => {
    directory = temporaryDirectory();
    const filename = path.join(directory, 'events.sqlite');
    const first = openBus(filename);
    first.bus.subscribeDurable('plugin', OrderCreated, () => {
      throw new Error('down');
    }, {maxAttempts: 5});
    first.bus.publish(sale('02/07/2017 10:00:00'));
    expect(rows(first.database)[0].status).to.equal('FAILED');
    first.bus.stop();
    first.database.close();

    const second = openBus(filename);
    const seen = [];
    try {
      second.bus.subscribeDurable('plugin', OrderCreated, event => {
        seen.push(event.id);
      }, {maxAttempts: 5});
      second.bus.start();
      expect(seen).to.deep.equal(['sale-02/07/2017 10:00:00']);
      expect(rows(second.database)).to.deep.equal([{
        aggregateId: 'sale-02/07/2017 10:00:00',
        status: 'DONE',
        attempts: 2,
        lastError: null
      }]);
    } finally {
      second.bus.stop();
      second.database.close();
    }
  });

  it('resumes a row left PROCESSING by a crash', () => {
    directory = temporaryDirectory();
    const opened = openBus(path.join(directory, 'events.sqlite'));
    const eventId = 'evt-crash';
    const payload = JSON.stringify({id: 'sale-7', createdAt: '02/07/2017 10:00:00', lines: []});
    opened.database.prepare(
      'INSERT INTO domain_event (id, type, payload, aggregate_id, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(eventId, 'OrderCreated', payload, 'sale-7', '2026-10-11T00:00:00.000Z');
    opened.database.prepare(
      'INSERT INTO domain_event_processing (event_id, subscriber_name, status, attempts, last_error, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?)'
    ).run(eventId, 'plugin', 'PROCESSING', 1, null, '2026-10-11T00:00:00.000Z');
    const seen = [];
    opened.bus.subscribeDurable('plugin', OrderCreated, event => seen.push(event.id));

    try {
      opened.bus.start();
      expect(seen).to.deep.equal(['sale-7']);
      expect(rows(opened.database)).to.deep.equal([{
        aggregateId: 'sale-7',
        status: 'DONE',
        attempts: 2,
        lastError: null
      }]);
    } finally {
      opened.bus.stop();
      opened.database.close();
    }
  });

  it('dead-letters an unknown event type instead of calling the handler', () => {
    directory = temporaryDirectory();
    const opened = openBus(path.join(directory, 'events.sqlite'));
    opened.database.prepare(
      'INSERT INTO domain_event (id, type, payload, aggregate_id, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run('evt-unknown', 'RetiredEvent', '{}', null, '2026-10-11T00:00:00.000Z');
    opened.database.prepare(
      'INSERT INTO domain_event_processing (event_id, subscriber_name, status, attempts, last_error, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?)'
    ).run('evt-unknown', 'plugin', 'PENDING', 0, null, '2026-10-11T00:00:00.000Z');
    let calls = 0;
    opened.bus.subscribeDurable('plugin', OrderCreated, () => {
      calls += 1;
    });

    try {
      opened.bus.processPending();
      expect(calls).to.equal(0);
      const row = opened.database.prepare(
        'SELECT status, last_error AS lastError FROM domain_event_processing WHERE event_id = ?'
      ).get('evt-unknown');
      expect(row.status).to.equal('DEAD');
      expect(row.lastError).to.equal('Unknown domain event type RetiredEvent');
    } finally {
      opened.bus.stop();
      opened.database.close();
    }
  });
});
