import {expect} from 'chai';
import * as Rx from 'rxjs';
import ChangeLayout from '../../../../../openMarket/application/service/appearance/ChangeLayout';
import AppearancePreferences from '../../../../../openMarket/domain/appearance/AppearancePreferences';
import ErrorCode from '../../../../../openMarket/domain/error/ErrorCode';

describe('ChangeLayout', () => {
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

  it('saves the preset and leaves the theme in place', done => {
    const stored = new AppearancePreferences({theme: 'ultramarinos', layout: 'mostrador'});
    const preferences = repository(stored);
    const useCase = new ChangeLayout({appearancePreferencesRepository: preferences});
    useCase.changeLayout({layout: 'escaner'}).subscribe(
      saved => {
        expect(saved.layout.id).to.equal('escaner');
        expect(saved.theme.id).to.equal('ultramarinos');
        expect(preferences.stored().layout.id).to.equal('escaner');
        expect(preferences.stored().theme.id).to.equal('ultramarinos');
        done();
      },
      error => done(error)
    );
  });

  it('fails with SELL_LAYOUT_INVALID and does not save', done => {
    const preferences = repository();
    const useCase = new ChangeLayout({appearancePreferencesRepository: preferences});
    useCase.changeLayout({layout: 'pastel'}).subscribe(
      () => done(new Error('should fail')),
      error => {
        expect(error.code).to.equal(ErrorCode.SELL_LAYOUT_INVALID);
        expect(preferences.stored().layout.id).to.equal('mostrador');
        done();
      }
    );
  });
});
