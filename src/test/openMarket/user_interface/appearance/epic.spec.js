import {expect} from 'chai';
import * as Rx from 'rxjs';
import appearanceReducer from '../../../../openMarket/user_interface/appearance/reducer';
import {THEME_CHANGED, themeChanged} from '../../../../openMarket/user_interface/appearance/action';
import {makeAppearanceEpic} from '../../../../openMarket/user_interface/appearance/epicFactory';

describe('Appearance theme', () => {
  const previous = global.document;

  beforeEach(() => {
    global.document = {documentElement: {dataset: {}}};
  });

  afterEach(() => {
    if (previous === undefined) {
      delete global.document;
    } else {
      global.document = previous;
    }
  });

  it('stores the saved theme when THEME_CHANGED arrives', () => {
    const next = appearanceReducer({theme: 'mercado', applied: 'ultramarinos'}, themeChanged('mostrador-noche'));
    expect(next).to.deep.equal({theme: 'mostrador-noche', applied: 'mostrador-noche'});
  });

  it('sets data-theme when THEME_CHANGED succeeds', done => {
    const epic = makeAppearanceEpic({
      changeTheme: {changeTheme: () => Rx.Observable.empty()}
    });
    epic(Rx.Observable.of(themeChanged('unexpected-neon'))).subscribe(
      () => {},
      error => done(error),
      () => {
        expect(document.documentElement.dataset.theme).to.equal('unexpected-neon');
        expect(themeChanged('unexpected-neon').type).to.equal(THEME_CHANGED);
        done();
      }
    );
  });
});
