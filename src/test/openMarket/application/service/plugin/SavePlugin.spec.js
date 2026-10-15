import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/mergeMap';
import SavePlugin from '../../../../../openMarket/application/service/plugin/SavePlugin';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';

function source(plugins) {
  return {list: () => Rx.Observable.of(plugins)};
}

describe('SavePlugin', () => {
  const sample = {
    id: 'sample',
    settings: [{key: 'nif', label: 'NIF', required: true}]
  };

  it('refuses to enable a plugin when a required setting is blank', done => {
    const useCase = new SavePlugin({
      pluginSource: source([sample]),
      pluginRepository: {save: () => Rx.Observable.of(null)}
    });

    useCase.save({pluginId: 'sample', enabled: true, config: {nif: '  '}}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.PLUGIN_SETTINGS_INCOMPLETE);
        done();
      }
    );
  });

  it('stores the enabled flag without loading the plugin', done => {
    let saved;
    const useCase = new SavePlugin({
      pluginSource: source([sample]),
      pluginRepository: {
        save(row) {
          saved = row;
          return Rx.Observable.of(null);
        }
      }
    });

    useCase.save({pluginId: 'sample', enabled: true, config: {nif: 'B123'}}).subscribe(() => {
      expect(saved).to.deep.equal({
        pluginId: 'sample',
        enabled: true,
        config: {nif: 'B123'},
        lastError: null
      });
      done();
    }, done);
  });

  it('fails when the folder is not installed', done => {
    const useCase = new SavePlugin({
      pluginSource: source([]),
      pluginRepository: {save: () => Rx.Observable.of(null)}
    });

    useCase.save({pluginId: 'missing', enabled: false, config: {}}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.PLUGIN_NOT_FOUND);
        done();
      }
    );
  });

  it('stores a required secret outside config and can enable when it is already stored', done => {
    const secrets = [];
    const saved = [];
    const stored = {};
    const secretStore = {
      get({key}) {
        return Rx.Observable.of(stored[key] || null);
      },
      put({key, value}) {
        secrets.push({key, value});
        stored[key] = value;
        return Rx.Observable.of(null);
      }
    };
    const useCase = new SavePlugin({
      pluginSource: source([{
        id: 'sample',
        settings: [
          {key: 'nif', label: 'NIF', required: true, secret: false},
          {key: 'certificatePassword', label: 'Certificate password', required: true, secret: true}
        ]
      }]),
      pluginRepository: {
        save(row) {
          saved.push(row);
          return Rx.Observable.of(null);
        }
      },
      secretStore
    });

    useCase.save({
      pluginId: 'sample',
      enabled: true,
      config: {nif: 'B123', certificatePassword: 's3cret'}
    }).flatMap(() => useCase.save({
      pluginId: 'sample',
      enabled: true,
      config: {nif: 'B123', certificatePassword: ''}
    })).subscribe(() => {
      expect(secrets).to.deep.equal([{key: 'certificatePassword', value: 's3cret'}]);
      expect(saved[0].config).to.deep.equal({nif: 'B123'});
      expect(saved[1].config).to.deep.equal({nif: 'B123'});
      expect(JSON.stringify(saved)).to.not.include('s3cret');
      done();
    }, done);
  });
});
