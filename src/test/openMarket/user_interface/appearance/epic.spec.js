import {expect} from 'chai';
import * as Rx from 'rxjs';
import appearanceReducer from '../../../../openMarket/user_interface/appearance/reducer';
import {
  THEME_CHANGE_FAILED,
  THEME_CHANGED,
  themeChangeRequested,
  themeChanged
} from '../../../../openMarket/user_interface/appearance/action';
import {makeAppearanceEpic, makeLayoutEpic} from '../../../../openMarket/user_interface/appearance/epicFactory';
import {
  LAYOUT_CHANGE_FAILED,
  LAYOUT_CHANGED,
  layoutChangeRequested,
  layoutChanged,
  layoutPreviewRequested
} from '../../../../openMarket/user_interface/appearance/action';

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

  it('keeps the theme when the layout changes', () => {
    const current = {theme: 'ultramarinos', applied: 'ultramarinos', layout: 'mostrador', appliedLayout: 'mostrador'};
    const next = appearanceReducer(current, layoutChanged('escaner'));
    expect(next.theme).to.equal('ultramarinos');
    expect(next.layout).to.equal('escaner');
    expect(next.appliedLayout).to.equal('escaner');
  });

  it('paints data-layout on preview and restores it when the save fails', done => {
    const epic = makeLayoutEpic({
      changeLayout: {changeLayout: () => Rx.Observable.throw(new Error('disk'))}
    });
    const actions = [];
    epic(Rx.Observable.of(layoutPreviewRequested('tactil'), layoutChangeRequested('tactil', 'mostrador'))).subscribe(
      action => actions.push(action),
      error => done(error),
      () => {
        expect(document.documentElement.dataset.layout).to.equal('mostrador');
        expect(actions.map(action => action.type)).to.include(LAYOUT_CHANGE_FAILED);
        const failed = actions.filter(action => action.type === LAYOUT_CHANGE_FAILED)[0];
        expect(failed.layout).to.equal('mostrador');
        const next = appearanceReducer(
          {theme: 'mercado', applied: 'mercado', layout: 'tactil', appliedLayout: 'tactil'},
          failed
        );
        expect(next.layout).to.equal('mostrador');
        expect(next.appliedLayout).to.equal('mostrador');
        expect(next.theme).to.equal('mercado');
        done();
      }
    );
  });

  it('sets data-layout when LAYOUT_CHANGED succeeds', done => {
    const epic = makeLayoutEpic({
      changeLayout: {changeLayout: () => Rx.Observable.empty()}
    });
    epic(Rx.Observable.of(layoutChanged('escaner'))).subscribe(
      () => {},
      error => done(error),
      () => {
        expect(document.documentElement.dataset.layout).to.equal('escaner');
        expect(layoutChanged('escaner').type).to.equal(LAYOUT_CHANGED);
        done();
      }
    );
  });
});
