import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import {PluginStatus} from '../../../../../openMarket/domain/plugin/pluginStatus';
import ListPlugins from '../../../../../openMarket/application/service/plugin/ListPlugins';

describe('ListPlugins', () => {
  it('joins a discovered plugin with its saved enabled flag', done => {
    const useCase = new ListPlugins({
      appVersion: '1.22.0',
      pluginSource: {
        directory: () => '/shops/plugins',
        list: () => Rx.Observable.of([{
          id: 'sample',
          name: 'Sample',
          description: 'Fixture',
          version: '1.0.0',
          settings: []
        }])
      },
      pluginRepository: {
        findAll: () => Rx.Observable.of([{
          pluginId: 'sample',
          enabled: true,
          config: {nif: 'B'},
          lastError: 'Plugin sample failed'
        }])
      }
    });

    useCase.list().subscribe(page => {
      expect(page.directory).to.equal('/shops/plugins');
      expect(page.appVersion).to.equal('1.22.0');
      expect(page.plugins).to.deep.equal([{
        id: 'sample',
        name: 'Sample',
        description: 'Fixture',
        version: '1.0.0',
        openmarket: null,
        settings: [],
        storedSecrets: [],
        enabled: true,
        config: {nif: 'B'},
        lastError: 'Plugin sample failed',
        status: PluginStatus.LOAD_ERROR,
        missingSettings: []
      }]);
      expect(page.encryption).to.deep.equal({available: false, backend: 'unknown'});
      done();
    }, done);
  });

  it('reports an incompatible range and a stored secret that completes configuration', done => {
    const useCase = new ListPlugins({
      appVersion: '1.22.0',
      pluginSource: {
        directory: () => '/shops/plugins',
        list: () => Rx.Observable.of([{
          id: 'old',
          name: 'Old',
          description: 'Out of range',
          version: '0.1.0',
          openmarket: '>=9.0.0',
          settings: [{key: 'nif', label: 'NIF', required: true, secret: false}]
        }, {
          id: 'fiscal',
          name: 'Fiscal',
          description: 'Ready',
          version: '0.2.0',
          openmarket: '>=1.15.0 <2',
          settings: [
            {key: 'nif', label: 'NIF', required: true, secret: false},
            {key: 'certificatePassword', label: 'Certificate password', required: true, secret: true}
          ]
        }])
      },
      pluginRepository: {
        findAll: () => Rx.Observable.of([{
          pluginId: 'fiscal',
          enabled: true,
          config: {nif: 'B123', certificatePassword: 'hidden'},
          lastError: null
        }])
      },
      secretStore: {
        status: () => Rx.Observable.of({available: true, backend: 'safe_storage'}),
        get({key}) {
          return Rx.Observable.of(key === 'certificatePassword' ? 's3cret' : null);
        }
      }
    });

    useCase.list().subscribe(page => {
      expect(page.plugins.map(plugin => ({
        id: plugin.id,
        openmarket: plugin.openmarket,
        status: plugin.status,
        missingSettings: plugin.missingSettings,
        storedSecrets: plugin.storedSecrets,
        config: plugin.config
      }))).to.deep.equal([{
        id: 'old',
        openmarket: '>=9.0.0',
        status: PluginStatus.INCOMPATIBLE,
        missingSettings: [{key: 'nif', label: 'NIF'}],
        storedSecrets: [],
        config: {}
      }, {
        id: 'fiscal',
        openmarket: '>=1.15.0 <2',
        status: PluginStatus.ACTIVE,
        missingSettings: [],
        storedSecrets: ['certificatePassword'],
        config: {nif: 'B123'}
      }]);
      done();
    }, done);
  });
});
