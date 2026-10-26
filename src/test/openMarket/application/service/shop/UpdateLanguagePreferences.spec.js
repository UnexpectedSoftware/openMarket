import {expect} from 'chai';
import * as Rx from 'rxjs';
import UpdateLanguagePreferences from '../../../../../openMarket/application/service/shop/UpdateLanguagePreferences';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';
import LanguagePreferences from '../../../../../openMarket/domain/shop/LanguagePreferences';

describe('UpdateLanguagePreferences', () => {
  it('loads, calls withLocale, and saves es', done => {
    const original = LanguagePreferences.defaults();
    let saved = null;
    const useCase = new UpdateLanguagePreferences({
      languagePreferencesRepository: {
        findPreferences: () => Rx.Observable.of(original),
        save: ({preferences}) => {
          saved = preferences;
          return Rx.Observable.of(preferences);
        }
      }
    });
    useCase.update({locale: 'es'}).subscribe(preferences => {
      expect(preferences).to.equal(saved);
      expect(preferences).to.not.equal(original);
      expect(preferences.locale).to.equal('es');
      expect(original.locale).to.equal('es');
      done();
    }, done);
  });

  it('does not save en', done => {
    let saved = false;
    const useCase = new UpdateLanguagePreferences({
      languagePreferencesRepository: {
        findPreferences: () => Rx.Observable.of(LanguagePreferences.defaults()),
        save: () => {
          saved = true;
          return Rx.Observable.of(null);
        }
      }
    });
    useCase.update({locale: 'en'}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(saved).to.equal(false);
        expect(error.code).to.equal(ErrorCode.LANGUAGE_INVALID);
        expect(error.context.locale).to.equal('en');
        done();
      }
    );
  });
});
