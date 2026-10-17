import {expect} from 'chai';
import * as Rx from 'rxjs';
import appearanceReducer from '../../../../openMarket/user_interface/appearance/reducer';
import {
  THEME_CHANGE_FAILED,
  THEME_CHANGED,
  themeChangeRequested,
  themeChanged
} from '../../../../openMarket/user_interface/appearance/action';
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

  it('counts a save request as stored so leaving Settings does not restore the old theme', () => {
    const next = appearanceReducer(
      {theme: 'mercado', applied: 'mostrador-noche'},
      themeChangeRequested('mostrador-noche', 'mercado')
    );
    expect(next).to.deep.equal({theme: 'mostrador-noche', applied: 'mostrador-noche'});
  });

  it('restores the previous theme when the save fails', done => {
    const epic = makeAppearanceEpic({
      changeTheme: {changeTheme: () => Rx.Observable.throw(new Error('disk'))}
    });
    const actions = [];
    epic(Rx.Observable.of(themeChangeRequested('ultramarinos', 'mercado'))).subscribe(
      action => actions.push(action),
      error => done(error),
      () => {
        expect(document.documentElement.dataset.theme).to.equal('mercado');
        expect(actions[0].type).to.equal(THEME_CHANGE_FAILED);
        expect(actions[0].theme).to.equal('mercado');
        const next = appearanceReducer({theme: 'ultramarinos', applied: 'ultramarinos'}, actions[0]);
        expect(next).to.deep.equal({theme: 'mercado', applied: 'mercado'});
        done();
      }
    );
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
