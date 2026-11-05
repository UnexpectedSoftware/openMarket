import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/toArray';
import {SETTINGS_SAVED} from '../../../../../openMarket/user_interface/settings/action';
import {
  SELL_PREFERENCES_LOADED,
  SELL_PREFERENCES_REQUESTED
} from '../../../../../openMarket/user_interface/order/new_order/action';
import {makeSellPreferencesEpic} from '../../../../../openMarket/user_interface/order/new_order/epicFactory';

describe('makeSellPreferencesEpic', () => {
  const stored = {printMode: 'never', headerText: 'Hola', footerText: '', paperWidthMm: 58};

  it('loads the till choice when the sell screen opens', done => {
    const useCase = {get: () => Rx.Observable.of(stored)};
    makeSellPreferencesEpic(useCase)(Rx.Observable.of({type: SELL_PREFERENCES_REQUESTED}))
      .toArray()
      .subscribe(actions => {
        expect(actions).to.deep.equal([{type: SELL_PREFERENCES_LOADED, payload: stored}]);
        done();
      }, done);
  });

  it('reloads after settings are saved and asks when the read is empty', done => {
    const useCase = {get: () => Rx.Observable.empty()};
    makeSellPreferencesEpic(useCase)(Rx.Observable.of({type: SETTINGS_SAVED}))
      .toArray()
      .subscribe(actions => {
        expect(actions).to.deep.equal([{type: SELL_PREFERENCES_LOADED, payload: null}]);
        makeSellPreferencesEpic(null)(Rx.Observable.of({type: SELL_PREFERENCES_REQUESTED}))
          .toArray()
          .subscribe(missing => {
            expect(missing).to.deep.equal([{type: SELL_PREFERENCES_LOADED, payload: null}]);
            const broken = {get: () => Rx.Observable.throw(new Error('db'))};
            makeSellPreferencesEpic(broken)(Rx.Observable.of({type: SELL_PREFERENCES_REQUESTED}))
              .toArray()
              .subscribe(failed => {
                expect(failed).to.deep.equal([{type: SELL_PREFERENCES_LOADED, payload: null}]);
                done();
              }, done);
          }, done);
      }, done);
  });
});
