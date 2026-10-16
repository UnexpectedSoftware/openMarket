import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/defer';
import OrderCreated from '../../../../openMarket/domain/event/OrderCreated';
import PluginHost, {PLUGIN_API_VERSION} from '../../../../openMarket/infrastructure/plugins/PluginHost';
import {deliveringDomainEventBus} from '../../support/domainEventBus';

function memoryRepository(rows = []) {
  return {
    rows,
    save(row) {
      return Rx.Observable.defer(() => {
        const index = rows.findIndex(item => item.pluginId === row.pluginId);
        const stored = {
          pluginId: row.pluginId,
          enabled: row.enabled,
          config: row.config || {},
          lastError: row.lastError
        };
        if (index === -1) {
          rows.push(stored);
        } else {
          rows[index] = stored;
        }
        return Rx.Observable.of(null);
      });
    },
    findAll() {
      return Rx.Observable.of(rows.map(row => ({...row})));
    }
  };
}

function manifest(overrides = {}) {
  return {
    id: 'sample',
    name: 'Sample',
    description: 'Fixture',
    version: '1.0.0',
    openmarket: null,
    main: 'index.js',
    settings: [],
    directory: '/tmp/sample',
    ...overrides
  };
}

function host({manifests, rows, appVersion = '1.15.0', loadPlugin, recordError = () => {}}) {
  const loaded = {count: 0};
  const wrapped = params => {
    loaded.count += 1;
    return loadPlugin(params);
  };
  const pluginHost = new PluginHost({
    pluginSource: {
      list: () => Rx.Observable.of(manifests),
      directory: () => '/tmp/plugins'
    },
    pluginRepository: memoryRepository(rows),
    domainEventBus: deliveringDomainEventBus(),
    connection: {database: {}},
    appVersion,
    loadPlugin: wrapped,
    events: {OrderCreated},
    recordError
  });
  return {pluginHost, loaded, rows};
}

describe('PluginHost', () => {
  it('loads only an enabled compatible plugin and passes api version 1', () => {
    let context;
    const {pluginHost, loaded} = host({
      manifests: [manifest(), manifest({id: 'other', directory: '/tmp/other'})],
      rows: [{pluginId: 'sample', enabled: true, config: {nif: 'B'}, lastError: 'old'}],
      loadPlugin: () => ({
        register(received) {
          context = received;
          received.eventBus.subscribeDurable('sample:note', OrderCreated, () => {});
        }
      })
    });

    pluginHost.start();
    pluginHost.start();

    expect(loaded.count).to.equal(1);
    expect(context.apiVersion).to.equal(PLUGIN_API_VERSION);
    expect(context.events.OrderCreated).to.equal(OrderCreated);
    expect(context.config).to.deep.equal({nif: 'B'});
  });

  it('skips a plugin whose range does not match and stores last_error', () => {
    const rows = [{pluginId: 'sample', enabled: true, config: {}, lastError: null}];
    const {pluginHost, loaded} = host({
      manifests: [manifest({openmarket: '>=9.0.0'})],
      rows,
      loadPlugin: () => {
        throw new Error('should not load');
      }
    });

    pluginHost.start();

    expect(loaded.count).to.equal(0);
    expect(rows[0].lastError).to.equal('Plugin sample requires OpenMarket >=9.0.0, this app is 1.15.0');
    expect(rows[0].enabled).to.equal(true);
  });

  it('keeps going when register throws and drops the subscriptions it made', () => {
    const bus = deliveringDomainEventBus();
    const rows = [{pluginId: 'sample', enabled: true, config: {}, lastError: null}];
    let syncRan = false;
    const pluginHost = new PluginHost({
      pluginSource: {
        list: () => Rx.Observable.of([manifest()]),
        directory: () => '/tmp/plugins'
      },
      pluginRepository: memoryRepository(rows),
      domainEventBus: bus,
      connection: {},
      appVersion: '1.15.0',
      events: {OrderCreated},
      recordError: () => {},
      loadPlugin: () => ({
        register({eventBus}) {
          eventBus.subscribeSync(OrderCreated, () => {
            syncRan = true;
          });
          eventBus.subscribeDurable('other:send', OrderCreated, () => {});
        }
      })
    });

    pluginHost.start();

    expect(rows[0].lastError).to.include('must start with "sample:"');
    expect(syncRan).to.equal(false);
    expect(() => bus.save(new OrderCreated({
      id: 'sale-1',
      createdAt: '02/07/2017 10:00:00',
      lines: []
    }))).to.not.throw();
  });

  it('passes secrets for this plugin only and keeps them out of config', () => {
    const values = {'sample:certificatePassword': 's3cret'};
    const secretStore = {
      put({pluginId, key, value}) {
        values[pluginId + ':' + key] = value;
        return Rx.Observable.of(null);
      },
      get({pluginId, key}) {
        const value = values[pluginId + ':' + key];
        return Rx.Observable.of(value == null ? null : value);
      }
    };
    const contexts = {};
    const rows = [{
      pluginId: 'sample',
      enabled: true,
      config: {nif: 'B', certificatePassword: 's3cret'},
      lastError: null
    }, {
      pluginId: 'other',
      enabled: true,
      config: {},
      lastError: null
    }];
    const pluginHost = new PluginHost({
      pluginSource: {
        list: () => Rx.Observable.of([
          manifest({
            settings: [
              {key: 'nif', label: 'NIF', required: false, secret: false},
              {key: 'certificatePassword', label: 'Certificate password', required: true, secret: true}
            ]
          }),
          manifest({id: 'other', directory: '/tmp/other', settings: []})
        ]),
        directory: () => '/tmp/plugins'
      },
      pluginRepository: memoryRepository(rows),
      domainEventBus: deliveringDomainEventBus(),
      connection: {},
      appVersion: '1.15.0',
      events: {OrderCreated},
      secretStore,
      loadPlugin: () => ({
        register(received) {
          contexts[received.config.nif || 'other'] = received;
        }
      })
    });

    pluginHost.start();

    expect(contexts.B.config).to.deep.equal({nif: 'B'});
    expect(rows.find(row => row.pluginId === 'sample').config.certificatePassword).to.equal(undefined);
    return Promise.all([
      contexts.B.secrets.get('certificatePassword'),
      contexts.other.secrets.get('certificatePassword')
    ]).then(([own, foreign]) => {
      expect(own).to.equal('s3cret');
      expect(foreign).to.equal(null);
    });
  });
});
