import {expect} from 'chai';
import * as Rx from 'rxjs';
import UpdateSellPreferences from '../../../../../openMarket/application/service/shop/UpdateSellPreferences';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';
import SellPreferences from '../../../../../openMarket/domain/shop/SellPreferences';

describe('UpdateSellPreferences', () => {
  it('loads, calls the methods, and saves a new value', done => {
    const original = SellPreferences.defaults();
    let saved = null;
    const useCase = new UpdateSellPreferences({
      sellPreferencesRepository: {
        findPreferences: () => Rx.Observable.of(original),
        save: ({preferences}) => {
          saved = preferences;
          return Rx.Observable.of(preferences);
        }
      }
    });
    useCase.update({
      printMode: 'never',
      headerText: '  Hola  ',
      footerText: 'Adios',
      paperWidthMm: 58
    }).subscribe(preferences => {
      expect(preferences).to.equal(saved);
      expect(preferences).to.not.equal(original);
      expect(preferences.printMode).to.equal('never');
      expect(preferences.headerText).to.equal('Hola');
      expect(preferences.footerText).to.equal('Adios');
      expect(preferences.paperWidthMm).to.equal(58);
      expect(original.printMode).to.equal('ask');
      expect(original.headerText).to.equal('');
      expect(original.paperWidthMm).to.equal(80);
      done();
    }, done);
  });

  it('does not save a header longer than 80 characters', done => {
    let saved = false;
    const useCase = new UpdateSellPreferences({
      sellPreferencesRepository: {
        findPreferences: () => Rx.Observable.of(SellPreferences.defaults()),
        save: () => {
          saved = true;
          return Rx.Observable.of(null);
        }
      }
    });
    useCase.update({
      printMode: 'ask',
      headerText: 'a'.repeat(81),
      footerText: '',
      paperWidthMm: 80
    }).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(saved).to.equal(false);
        expect(error.code).to.equal(ErrorCode.SELL_PREFERENCES_INVALID);
        expect(error.context.field).to.equal('headerText');
        done();
      }
    );
  });
});
