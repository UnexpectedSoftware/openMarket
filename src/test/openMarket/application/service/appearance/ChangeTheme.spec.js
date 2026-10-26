import {expect} from 'chai';
import * as Rx from 'rxjs';
import ChangeTheme from '../../../../../openMarket/application/service/appearance/ChangeTheme';
import AppearancePreferences from '../../../../../openMarket/domain/appearance/AppearancePreferences';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';

describe('ChangeTheme', () => {
  function repository(initial) {
    let stored = initial || AppearancePreferences.defaults();
    return {
      stored: () => stored,
      findPreferences: () => Rx.Observable.of(stored),
      save: ({preferences}) => {
        stored = preferences;
        return Rx.Observable.of(preferences);
      }
    };
  }

  it('saves the theme the cashier picked', done => {
    const preferences = repository();
    const useCase = new ChangeTheme({appearancePreferencesRepository: preferences});
    useCase.changeTheme({theme: 'mostrador-noche'}).subscribe(
      saved => {
        expect(saved.theme.id).to.equal('mostrador-noche');
        expect(saved.layout.id).to.equal('mostrador');
        expect(preferences.stored().theme.id).to.equal('mostrador-noche');
        expect(preferences.stored().layout.id).to.equal('mostrador');
        done();
      },
      error => done(error)
    );
  });

  it('fails with THEME_INVALID and does not save', done => {
    const preferences = repository();
    const useCase = new ChangeTheme({appearancePreferencesRepository: preferences});
    useCase.changeTheme({theme: 'pastel'}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.THEME_INVALID);
        expect(preferences.stored().theme.id).to.equal('mercado');
        done();
      }
    );
  });
});
