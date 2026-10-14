import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import ListPlugins from '../../../../../openMarket/application/service/plugin/ListPlugins';

describe('ListPlugins', () => {
  it('joins a discovered plugin with its saved enabled flag', done => {
    const useCase = new ListPlugins({
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
      expect(page.plugins).to.deep.equal([{
        id: 'sample',
        name: 'Sample',
        description: 'Fixture',
        version: '1.0.0',
        settings: [],
        enabled: true,
        config: {nif: 'B'},
        lastError: 'Plugin sample failed'
      }]);
      done();
    }, done);
  });
});
