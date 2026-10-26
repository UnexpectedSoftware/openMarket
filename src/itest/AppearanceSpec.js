import {expect} from 'chai';
import 'rxjs/add/operator/mergeMap';
import AppearancePreferences from '../openMarket/domain/appearance/AppearancePreferences';
import {DatabaseSync} from 'node:sqlite';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import sqliteDatabasePath from '../openMarket/infrastructure/service/sqliteDatabasePath';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const repository = container.getInstance({key: 'appearancePreferencesRepository'});
const changeTheme = openMarket.get('appearance_change_theme_use_case');
const changeLayout = openMarket.get('appearance_change_layout_use_case');
const getAppearance = openMarket.get('appearance_get_use_case');
const updateShopProfile = openMarket.get('shop_update_profile_use_case');

const SAVE_SETTING = 'INSERT INTO setting (key, value_json) VALUES (?, ?) ' +
  'ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json';

function themeOnAnotherConnection() {
  const other = new DatabaseSync(sqliteDatabasePath(), {readOnly: true, timeout: 5000});
  try {
    const row = other.prepare('SELECT value_json FROM setting WHERE key = ?').get('appearance');
    return row ? JSON.parse(row.value_json).theme : null;
  } finally {
    other.close();
  }
}

function restoreShopProfile(previous) {
  if (previous) {
    database.prepare(SAVE_SETTING).run('shop_profile', previous.value_json);
  } else {
    database.prepare('DELETE FROM setting WHERE key = ?').run('shop_profile');
  }
}

describe('Appearance preferences', () => {
  beforeEach(() => {
    database.prepare('DELETE FROM setting WHERE key = ?').run('appearance');
  });

  afterEach(() => {
    database.prepare('DELETE FROM setting WHERE key = ?').run('appearance');
  });

  it('returns Mercado and Mostrador when the setting row is missing', done => {
    getAppearance.get().subscribe(preferences => {
      expect(preferences.theme).to.equal('mercado');
      expect(preferences.layout).to.equal('mostrador');
      expect(preferences).to.not.be.instanceof(AppearancePreferences);
      done();
    }, done);
  });

  it('reads Mostrador from a row that only stored a theme', done => {
    database.prepare(SAVE_SETTING).run('appearance', JSON.stringify({theme: 'ultramarinos'}));
    getAppearance.get().flatMap(view => repository.findPreferences().map(aggregate => ({view, aggregate}))).subscribe(
      loaded => {
        expect(loaded.view.theme).to.equal('ultramarinos');
        expect(loaded.view.layout).to.equal('mostrador');
        expect(loaded.view).to.not.be.instanceof(AppearancePreferences);
        expect(loaded.aggregate).to.be.instanceof(AppearancePreferences);
        expect(loaded.aggregate.layout.id).to.equal('mostrador');
        expect(loaded.aggregate.theme.id).to.equal('ultramarinos');
        done();
      },
      done
    );
  });

  it('saves a layout and leaves the theme in place', done => {
    changeTheme.changeTheme({theme: 'unexpected-neon'}).flatMap(() => changeLayout.changeLayout({layout: 'tactil'}))
      .subscribe(() => {
        const row = database.prepare('SELECT value_json FROM setting WHERE key = ?').get('appearance');
        const stored = JSON.parse(row.value_json);
        expect(stored.theme).to.equal('unexpected-neon');
        expect(stored.layout).to.equal('tactil');
        getAppearance.get().subscribe(preferences => {
          expect(preferences.layout).to.equal('tactil');
          expect(preferences.theme).to.equal('unexpected-neon');
          expect(preferences).to.not.be.instanceof(AppearancePreferences);
          done();
        }, done);
      }, done);
  });

  it('saves a theme and reads it back from the setting table', done => {
    changeTheme.changeTheme({theme: 'ultramarinos'}).subscribe(() => {
      repository.findPreferences().subscribe(preferences => {
        const row = database.prepare('SELECT value_json FROM setting WHERE key = ?').get('appearance');
        expect(preferences.theme.id).to.equal('ultramarinos');
        expect(JSON.parse(row.value_json).theme).to.equal('ultramarinos');
        done();
      }, done);
    }, done);
  });

  it('commits the theme so another connection still sees it after the shop profile is saved', done => {
    const previousShop = database.prepare('SELECT value_json FROM setting WHERE key = ?').get('shop_profile');
    changeTheme.changeTheme({theme: 'mostrador-noche'}).flatMap(() => updateShopProfile.update({
      nif: '',
      legalName: '',
      tradeName: '',
      street: '',
      postalCode: '',
      city: '',
      province: '',
      country: 'ES',
      invoicingEnabled: false
    })).subscribe(() => {
      try {
        expect(themeOnAnotherConnection()).to.equal('mostrador-noche');
      } catch (error) {
        restoreShopProfile(previousShop);
        done(error);
        return;
      }
      getAppearance.get().subscribe(preferences => {
        try {
          expect(preferences.theme).to.equal('mostrador-noche');
          const row = database.prepare('SELECT value_json FROM setting WHERE key = ?').get('shop_profile');
          expect(row).to.not.equal(undefined);
          done();
        } catch (error) {
          done(error);
        } finally {
          restoreShopProfile(previousShop);
        }
      }, error => {
        restoreShopProfile(previousShop);
        done(error);
      });
    }, error => {
      restoreShopProfile(previousShop);
      done(error);
    });
  });
});
