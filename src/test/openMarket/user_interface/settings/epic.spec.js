import {expect} from 'chai';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import ShopProfileView from '../../../../openMarket/domain/shop/ShopProfileView';
import InvalidTaxIdError from '../../../../openMarket/domain/shop/InvalidTaxIdError';
import ShopProfileIncompleteError from '../../../../openMarket/domain/shop/ShopProfileIncompleteError';
import {THEME_CHANGED, THEME_CHANGE_FAILED} from '../../../../openMarket/user_interface/appearance/action';
import {
  SETTINGS_FAILED,
  SETTINGS_LOADED,
  SETTINGS_PAGE_OPENED,
  SETTINGS_SAVE_FAILED,
  SETTINGS_SAVE_REQUESTED,
  SETTINGS_SAVED,
  SHOP_PROFILE_LOADED,
  SHOP_PROFILE_REQUESTED
} from '../../../../openMarket/user_interface/settings/action';
import {makeSettingsLoadEpic, makeSettingsSaveEpic} from '../../../../openMarket/user_interface/settings/epicFactory';
import {LOAD_ERROR, NIF_INVALID, REQUIRED, SAVE_ERROR, THEME_SAVE_ERROR, draftChanged, shopLoaded, state} from '../../../../openMarket/user_interface/settings/model';
import reducer from '../../../../openMarket/user_interface/settings/reducer';

function view(extra) {
  return new ShopProfileView({
    nif: 'B12345674',
    legalName: 'Ultramarinos Pérez SL',
    tradeName: 'Ultramarinos Pérez',
    street: 'Mayor 1',
    phone: '600',
    email: 'a@b.es',
    invoicingEnabled: false,
    ...extra
  });
}

function page(extra, theme) {
  return shopLoaded(state(), view(), {theme: theme || 'mercado'});
}

function storeOf(settings, appearance) {
  return {
    getState: () => ({
      settings,
      appearance: appearance || {theme: settings.persistedTheme, applied: settings.persistedTheme}
    })
  };
}

function collect(epic, action, store, done, assert) {
  const actions = [];
  epic(Rx.Observable.of(action), store).subscribe(
    next => actions.push(next),
    error => done(error),
    () => {
      try {
        assert(actions);
        done();
      } catch (error) {
        done(error);
      }
    }
  );
}

describe('settings epics', () => {
  it('stores view fields and does not call snapshot', done => {
    let snapshotted = false;
    const profile = {
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      street: 'Mayor 1',
      postalCode: '28001',
      city: 'Madrid',
      province: 'Madrid',
      country: 'ES',
      phone: '600111222',
      email: 'perez@example.com',
      invoicingEnabled: true,
      issuer: {nif: 'B12345674', legalName: 'Ultramarinos Pérez SL'},
      snapshot: () => {
        snapshotted = true;
        return {nif: 'NO'};
      }
    };
    const epic = makeSettingsLoadEpic({getProfile: () => Rx.Observable.of(profile)});
    collect(epic, {type: SETTINGS_PAGE_OPENED}, storeOf(state(), {theme: 'ultramarinos'}), done, actions => {
      expect(snapshotted).to.equal(false);
      expect(actions).to.have.length(1);
      expect(actions[0].type).to.equal(SETTINGS_LOADED);
      expect(actions[0].theme).to.equal('ultramarinos');
      expect(actions[0].profile.phone).to.equal('600111222');
      expect(actions[0].profile.email).to.equal('perez@example.com');
      expect(actions[0].profile.issuer).to.equal(profile.issuer);
      const loaded = reducer(state(), actions[0]);
      expect(loaded.draft.phone).to.equal('600111222');
      expect(loaded.draft.theme).to.equal('ultramarinos');
      expect(loaded.issuer).to.equal(profile.issuer);
    });
  });

  it('refreshes the issuer for the sell screen and reports a failed page load', done => {
    const epic = makeSettingsLoadEpic({getProfile: () => Rx.Observable.of(new ShopProfileView())});
    collect(epic, {type: SHOP_PROFILE_REQUESTED}, storeOf(state()), done, actions => {
      expect(actions.map(action => action.type)).to.deep.equal([SHOP_PROFILE_LOADED]);
      const kept = reducer(draftChanged(page(), {legalName: 'Temporal'}), actions[0]);
      expect(kept.draft.legalName).to.equal('Temporal');
      expect(kept.issuer).to.equal(null);
    });
  });

  it('uses the load error when the page cannot be read and ignores a sell-screen failure', done => {
    const failing = makeSettingsLoadEpic({getProfile: () => Rx.Observable.throw(new Error('disk'))});
    collect(failing, {type: SETTINGS_PAGE_OPENED}, storeOf(state()), err => {
      if (err) {
        done(err);
        return;
      }
      collect(failing, {type: SHOP_PROFILE_REQUESTED}, storeOf(state()), done, sellActions => {
        expect(sellActions).to.deep.equal([]);
      });
    }, actions => {
      expect(actions).to.deep.equal([{type: SETTINGS_FAILED, message: LOAD_ERROR}]);
    });
  });

  it('sends phone and email and does not call update for a theme-only change', done => {
    let command = null;
    let theme = null;
    const savedView = view({phone: '600111222', email: 'perez@example.com', legalName: 'Nuevo'});
    const deps = {
      updateShopProfile: {update: value => {
        command = value;
        return Rx.Observable.of(null);
      }},
      changeTheme: {changeTheme: ({theme: id}) => {
        theme = id;
        return Rx.Observable.of({theme: {id}});
      }},
      getShopProfile: {getProfile: () => Rx.Observable.of(savedView)}
    };
    const shop = reducer(draftChanged(page(), {
      legalName: 'Nuevo',
      phone: ' 600111222 ',
      email: ' perez@example.com '
    }), {type: SETTINGS_SAVE_REQUESTED});
    const epic = makeSettingsSaveEpic(deps);
    collect(epic, {type: SETTINGS_SAVE_REQUESTED}, storeOf(shop), err => {
      if (err) {
        done(err);
        return;
      }
      expect(command.phone).to.equal('600111222');
      expect(command.email).to.equal('perez@example.com');
      expect(command.legalName).to.equal('Nuevo');
      const themeOnly = reducer(draftChanged(page(), {theme: 'ultramarinos'}), {type: SETTINGS_SAVE_REQUESTED});
      command = null;
      collect(epic, {type: SETTINGS_SAVE_REQUESTED}, storeOf(themeOnly), done, actions => {
        expect(command).to.equal(null);
        expect(theme).to.equal('ultramarinos');
        expect(actions[0].type).to.equal(SETTINGS_SAVED);
        expect(actions[1].type).to.equal(THEME_CHANGED);
        expect(actions[1].theme).to.equal('ultramarinos');
        expect(actions.filter(action => action.title === 'Ajustes guardados')).to.have.length(1);
        expect(actions).to.have.length(3);
      });
    }, () => {});
  });

  it('turns an invalid NIF into a field error and does not toast', done => {
    let themes = 0;
    const current = reducer(draftChanged(page(), {nif: '12345678A'}), {type: SETTINGS_SAVE_REQUESTED});
    expect(current.saving).to.equal(true);
    const epic = makeSettingsSaveEpic({
      updateShopProfile: {update: () => Rx.Observable.throw(new InvalidTaxIdError({nif: '12345678A'}))},
      changeTheme: {changeTheme: () => {
        themes += 1;
        return Rx.Observable.of({theme: {id: 'mercado'}});
      }},
      getShopProfile: {getProfile: () => Rx.Observable.of(view())}
    });
    collect(epic, {type: SETTINGS_SAVE_REQUESTED}, storeOf(current), done, actions => {
      expect(themes).to.equal(0);
      expect(actions).to.deep.equal([{
        type: SETTINGS_SAVE_FAILED,
        failure: {fieldErrors: {nif: NIF_INVALID}}
      }]);
      expect(actions.map(action => action.title)).to.not.include('Ajustes guardados');
      const failed = reducer(current, actions[0]);
      expect(failed.draft.nif).to.equal('12345678A');
      expect(failed.saving).to.equal(false);
    });
  });

  it('maps an incomplete shop onto the fields and does not start the theme save', done => {
    const open = reducer(draftChanged(page(), {invoicingEnabled: true}), {type: SETTINGS_SAVE_REQUESTED});
    expect(open.saving).to.equal(true);
    const epic = makeSettingsSaveEpic({
      updateShopProfile: {update: () => Rx.Observable.throw(new ShopProfileIncompleteError())},
      changeTheme: {changeTheme: () => Rx.Observable.throw(new Error('theme'))},
      getShopProfile: {getProfile: () => Rx.Observable.of(view())}
    });
    collect(epic, {type: SETTINGS_SAVE_REQUESTED}, storeOf(open), done, actions => {
      expect(actions[0].failure.fieldErrors).to.deep.equal({nif: REQUIRED, legalName: REQUIRED});
      expect(actions.map(action => action.type)).to.not.include(THEME_CHANGE_FAILED);
      expect(actions.map(action => action.title)).to.not.include('Ajustes guardados');
    });
  });

  it('rolls the preview back when the theme save fails', done => {
    const current = reducer(draftChanged(page({}, 'ultramarinos'), {theme: 'unexpected-neon'}), {
      type: SETTINGS_SAVE_REQUESTED
    });
    let updates = 0;
    const epic = makeSettingsSaveEpic({
      updateShopProfile: {update: () => {
        updates += 1;
        return Rx.Observable.of(null);
      }},
      changeTheme: {changeTheme: () => Rx.Observable.throw(new Error('disk'))},
      getShopProfile: {getProfile: () => Rx.Observable.of(view())}
    });
    collect(epic, {type: SETTINGS_SAVE_REQUESTED}, storeOf(current), done, actions => {
      expect(updates).to.equal(0);
      expect(actions[0]).to.deep.equal({type: THEME_CHANGE_FAILED, theme: 'ultramarinos'});
      expect(actions[1].type).to.equal(SETTINGS_SAVE_FAILED);
      expect(actions[1].failure).to.deep.equal({message: THEME_SAVE_ERROR, theme: 'ultramarinos'});
      expect(actions.map(action => action.title)).to.not.include('Ajustes guardados');
    });
  });

  it('does not call a use case when Guardar has nothing to write', done => {
    let calls = 0;
    const epic = makeSettingsSaveEpic({
      updateShopProfile: {update: () => {
        calls += 1;
        return Rx.Observable.of(null);
      }},
      changeTheme: {changeTheme: () => {
        calls += 1;
        return Rx.Observable.of({theme: {id: 'mercado'}});
      }},
      getShopProfile: {getProfile: () => Rx.Observable.of(view())}
    });
    const current = page();
    expect(reducer(current, {type: SETTINGS_SAVE_REQUESTED})).to.equal(current);
    collect(epic, {type: SETTINGS_SAVE_REQUESTED}, storeOf(current), done, actions => {
      expect(actions).to.deep.equal([]);
      expect(calls).to.equal(0);
    });
  });

  it('reports a shop failure without a toast', done => {
    const current = reducer(draftChanged(page(), {city: 'Sevilla'}), {type: SETTINGS_SAVE_REQUESTED});
    const epic = makeSettingsSaveEpic({
      updateShopProfile: {update: () => Rx.Observable.throw(new Error('disk'))},
      changeTheme: {changeTheme: () => Rx.Observable.of({theme: {id: 'mercado'}})},
      getShopProfile: {getProfile: () => Rx.Observable.of(view())}
    });
    collect(epic, {type: SETTINGS_SAVE_REQUESTED}, storeOf(current), done, actions => {
      expect(actions).to.deep.equal([{type: SETTINGS_SAVE_FAILED, failure: {message: SAVE_ERROR}}]);
    });
  });
});
