import fs from 'fs';
import os from 'os';
import path from 'path';
import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import SqliteConnection from '../openMarket/infrastructure/service/SqliteConnection';
import SqliteTransaction from '../openMarket/infrastructure/service/SqliteTransaction';
import SqliteDomainEventRepository from '../openMarket/infrastructure/event/SqliteDomainEventRepository';
import SqlitePluginRepository from '../openMarket/infrastructure/plugins/SqlitePluginRepository';
import FolderPluginSource from '../openMarket/infrastructure/plugins/FolderPluginSource';
import PluginHost from '../openMarket/infrastructure/plugins/PluginHost';
import loadPlugin from '../openMarket/infrastructure/plugins/loadPlugin';
import DomainEventBus from '../openMarket/domain/service/DomainEventBus';
import RandomUUIDIdentity from '../openMarket/domain/RandomUUIDIdentity';
import OrderCreated from '../openMarket/domain/event/OrderCreated';
import {eventClasses} from '../openMarket/domain/event/registry';

function temporaryDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-plugin-'));
}

function sale() {
  return new OrderCreated({
    id: 'sale-1',
    createdAt: '14/10/2026 10:00:00',
    lines: [{barcode: '0001', name: 'Coca-Cola', price: 0.55, quantity: 1}]
  });
}

describe('Plugins', () => {
  it('rolls back a sync insert with the transaction', done => {
    const directory = temporaryDirectory();
    const connection = new SqliteConnection({filename: path.join(directory, 'shop.sqlite')});
    const database = connection.database;
    database.exec('CREATE TABLE sample_note (id TEXT PRIMARY KEY)');
    const transaction = new SqliteTransaction({connection});
    const bus = new DomainEventBus({
      repository: new SqliteDomainEventRepository({connection}),
      identity: new RandomUUIDIdentity(),
      clock: {now: () => '2026-10-14T00:00:00.000Z'},
      inTransaction: () => database.isTransaction
    });
    bus.subscribeSync(OrderCreated, () => {
      database.prepare('INSERT INTO sample_note (id) VALUES (?)').run('1');
      throw new Error('sync failed');
    });

    transaction.run(() => {
      bus.save(sale());
      return Rx.Observable.of(null);
    }).subscribe(
      () => done(new Error('should fail')),
      () => {
        expect(database.prepare('SELECT COUNT(*) AS total FROM sample_note').get().total).to.equal(0);
        expect(database.prepare('SELECT COUNT(*) AS total FROM domain_event').get().total).to.equal(0);
        done();
      }
    );
  });

  it('loads an enabled plugin from its folder', () => {
    const directory = temporaryDirectory();
    const plugins = path.join(directory, 'plugins');
    const sample = path.join(plugins, 'sample');
    fs.mkdirSync(sample, {recursive: true});
    fs.writeFileSync(path.join(sample, 'plugin.json'), JSON.stringify({
      id: 'sample',
      name: 'Sample',
      description: 'Fixture',
      version: '1.0.0'
    }));
    fs.writeFileSync(path.join(sample, 'index.js'), [
      'module.exports = {',
      '  register({eventBus, events, apiVersion}) {',
      '    if (apiVersion !== 1) {',
      '      throw new Error("api");',
      '    }',
      '    eventBus.subscribeDurable("note", events.OrderCreated, () => {});',
      '  }',
      '};',
      ''
    ].join('\n'));
    const connection = new SqliteConnection({filename: path.join(directory, 'shop.sqlite')});
    const repository = new SqlitePluginRepository({connection});
    let saveError;
    repository.save({pluginId: 'sample', enabled: true, config: {}, lastError: null}).subscribe(
      () => {},
      error => {
        saveError = error;
      }
    );
    expect(saveError).to.equal(undefined);
    const bus = new DomainEventBus({
      repository: new SqliteDomainEventRepository({connection}),
      identity: new RandomUUIDIdentity(),
      clock: {now: () => '2026-10-14T00:00:00.000Z'},
      inTransaction: () => connection.database.isTransaction
    });
    const pluginHost = new PluginHost({
      pluginSource: new FolderPluginSource({directory: plugins}),
      pluginRepository: repository,
      domainEventBus: bus,
      connection,
      appVersion: '1.15.0',
      loadPlugin,
      events: eventClasses(),
      recordError: () => {}
    });

    pluginHost.start();
    bus.save(sale());
    bus.fanOut();

    const names = connection.database.prepare(
      'SELECT subscriber_name AS subscriberName FROM domain_event_processing'
    ).all().map(row => row.subscriberName);
    expect(names).to.deep.equal(['sample:note']);
  });
});
