import {expect} from 'chai';
import 'rxjs/add/operator/mergeMap';
import openMarket from '../openMarket/application/index';
import container from '../openMarket/infrastructure/dic/Container';
import AppearancePreferences from '../openMarket/domain/appearance/AppearancePreferences';
import AppearancePreferencesQuery from '../openMarket/domain/appearance/AppearancePreferencesQuery';
import AppearancePreferencesView from '../openMarket/domain/appearance/AppearancePreferencesView';
import LanguagePreferences from '../openMarket/domain/shop/LanguagePreferences';
import LanguagePreferencesQuery from '../openMarket/domain/shop/LanguagePreferencesQuery';
import LanguagePreferencesView from '../openMarket/domain/shop/LanguagePreferencesView';
import PrinterSettings from '../openMarket/domain/shop/PrinterSettings';
import PrinterSettingsQuery from '../openMarket/domain/shop/PrinterSettingsQuery';
import PrinterSettingsView from '../openMarket/domain/shop/PrinterSettingsView';
import SellPreferences from '../openMarket/domain/shop/SellPreferences';
import SellPreferencesQuery from '../openMarket/domain/shop/SellPreferencesQuery';
import SellPreferencesView from '../openMarket/domain/shop/SellPreferencesView';
import ShopProfile from '../openMarket/domain/shop/ShopProfile';
import ShopProfileQuery from '../openMarket/domain/shop/ShopProfileQuery';
import ShopProfileView from '../openMarket/domain/shop/ShopProfileView';

const database = container.getInstance({key: 'sqliteConnection'}).database;
const shopRepository = container.getInstance({key: 'shopProfileRepository'});
const sellRepository = container.getInstance({key: 'sellPreferencesRepository'});
const appearanceRepository = container.getInstance({key: 'appearancePreferencesRepository'});
const printerRepository = container.getInstance({key: 'printerSettingsRepository'});
const languageRepository = container.getInstance({key: 'languagePreferencesRepository'});
const updateShopProfile = openMarket.get('shop_update_profile_use_case');
const updateSellPreferences = openMarket.get('sell_update_preferences_use_case');
const updatePrinterSettings = openMarket.get('shop_update_printer_use_case');
const updateLanguagePreferences = openMarket.get('shop_update_language_use_case');
const changeTheme = openMarket.get('appearance_change_theme_use_case');

const KEYS = ['shop_profile', 'appearance', 'sell_auto_print', 'printer', 'language'];
const SAVE_SETTING = 'INSERT INTO setting (key, value_json) VALUES (?, ?) ' +
  'ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json';

function readKeys() {
  return KEYS.map(key => database.prepare('SELECT value_json FROM setting WHERE key = ?').get(key) || null);
}

function restore(saved) {
  KEYS.forEach((key, index) => {
    const row = saved[index];
    if (row) {
      database.prepare(SAVE_SETTING).run(key, row.value_json);
    } else {
      database.prepare('DELETE FROM setting WHERE key = ?').run(key);
    }
  });
}

describe('Settings read models', () => {
  let saved;

  beforeEach(() => {
    saved = readKeys();
    KEYS.forEach(key => database.prepare('DELETE FROM setting WHERE key = ?').run(key));
  });

  afterEach(() => {
    restore(saved);
  });

  it('reads a shop view after the profile is saved, and the aggregate from findProfile', done => {
    updateShopProfile.update({
      nif: 'B12345674',
      legalName: 'Ultramarinos Pérez SL',
      tradeName: 'Ultramarinos Pérez',
      street: 'Mayor 1',
      postalCode: '28001',
      city: 'Madrid',
      province: 'Madrid',
      country: 'ES',
      invoicingEnabled: true,
      phone: '  600111222  ',
      email: '  perez@example.com  '
    }).flatMap(() => shopRepository.find(new ShopProfileQuery()))
      .flatMap(view => shopRepository.findProfile().map(profile => ({view, profile})))
      .subscribe(({view, profile}) => {
        expect(view.nif).to.equal('B12345674');
        expect(view.issuer.legalName).to.equal('Ultramarinos Pérez SL');
        expect(view.phone).to.equal('600111222');
        expect(view.email).to.equal('perez@example.com');
        expect(view.issuer).to.not.have.property('phone');
        expect(profile.phone).to.equal('600111222');
        expect(profile.snapshot()).to.not.have.property('phone');
        expect(view).to.be.instanceof(ShopProfileView);
        expect(view).to.not.be.instanceof(ShopProfile);
        expect(profile).to.be.instanceof(ShopProfile);
        expect(profile.nif.value).to.equal('B12345674');
        expect(profile.snapshot().legalName).to.equal('Ultramarinos Pérez SL');
        done();
      }, done);
  });

  it('returns the empty shop view when the row is missing', done => {
    shopRepository.find(new ShopProfileQuery()).subscribe(view => {
      expect(view).to.be.instanceof(ShopProfileView);
      expect(view).to.not.be.instanceof(ShopProfile);
      expect(view.nif).to.equal(null);
      expect(view.legalName).to.equal('');
      expect(view.country).to.equal('ES');
      expect(view.timeZone).to.equal('Europe/Madrid');
      expect(view.invoicingEnabled).to.equal(false);
      expect(view.phone).to.equal('');
      expect(view.email).to.equal('');
      expect(view.issuer).to.equal(null);
      done();
    }, done);
  });

  it('round-trips the appearance view and still returns the aggregate', done => {
    appearanceRepository.find(new AppearancePreferencesQuery())
      .flatMap(missing => {
        expect(missing).to.be.instanceof(AppearancePreferencesView);
        expect(missing).to.not.be.instanceof(AppearancePreferences);
        expect(missing.theme).to.equal('mercado');
        return changeTheme.changeTheme({theme: 'ultramarinos'});
      })
      .flatMap(() => appearanceRepository.find(new AppearancePreferencesQuery()))
      .flatMap(view => appearanceRepository.findPreferences().map(profile => ({view, profile})))
      .subscribe(({view, profile}) => {
        expect(view.theme).to.equal('ultramarinos');
        expect(view).to.not.be.instanceof(AppearancePreferences);
        expect(typeof view.theme).to.equal('string');
        expect(profile).to.be.instanceof(AppearancePreferences);
        expect(profile.theme.id).to.equal('ultramarinos');
        done();
      }, done);
  });

  it('round-trips the sell view and still returns the aggregate', done => {
    sellRepository.find(new SellPreferencesQuery())
      .flatMap(missing => {
        expect(missing).to.be.instanceof(SellPreferencesView);
        expect(missing).to.not.be.instanceof(SellPreferences);
        expect(missing.printMode).to.equal('ask');
        expect(missing.headerText).to.equal('');
        expect(missing.footerText).to.equal('');
        expect(missing.paperWidthMm).to.equal(80);
        expect(missing.autoPrint).to.equal(undefined);
        return updateSellPreferences.update({
          printMode: 'always',
          headerText: ' Hola ',
          footerText: 'Adios',
          paperWidthMm: 58
        });
      })
      .flatMap(() => sellRepository.find(new SellPreferencesQuery()))
      .flatMap(view => sellRepository.findPreferences().map(profile => ({view, profile})))
      .subscribe(({view, profile}) => {
        expect(view.printMode).to.equal('always');
        expect(view.headerText).to.equal('Hola');
        expect(view.footerText).to.equal('Adios');
        expect(view.paperWidthMm).to.equal(58);
        expect(view).to.not.be.instanceof(SellPreferences);
        expect(view.withPrintMode).to.equal(undefined);
        expect(view.autoPrint).to.equal(undefined);
        expect(profile).to.be.instanceof(SellPreferences);
        expect(profile.printMode).to.equal('always');
        expect(profile.headerText).to.equal('Hola');
        expect(profile.paperWidthMm).to.equal(58);
        expect(profile.autoPrint).to.equal(undefined);
        done();
      }, done);
  });

  it('reads a printer view after the settings are saved, and the default when the row is missing', done => {
    printerRepository.find(new PrinterSettingsQuery())
      .flatMap(missing => {
        expect(missing).to.be.instanceof(PrinterSettingsView);
        expect(missing).to.not.be.instanceof(PrinterSettings);
        expect(missing.type).to.equal('epson');
        expect(missing.interface).to.equal('/dev/usb/lp');
        expect(missing.characterSet).to.equal('SPAIN1');
        expect(missing.withType).to.equal(undefined);
        return updatePrinterSettings.update({
          type: 'star',
          interface: '  tcp://127.0.0.1:9100  ',
          characterSet: 'PC858'
        });
      })
      .flatMap(() => printerRepository.find(new PrinterSettingsQuery()))
      .flatMap(view => printerRepository.findSettings().map(settings => ({view, settings})))
      .subscribe(({view, settings}) => {
        expect(view.type).to.equal('star');
        expect(view.interface).to.equal('tcp://127.0.0.1:9100');
        expect(view.characterSet).to.equal('PC858');
        expect(view).to.be.instanceof(PrinterSettingsView);
        expect(view).to.not.be.instanceof(PrinterSettings);
        expect(settings).to.be.instanceof(PrinterSettings);
        expect(settings.type).to.equal('star');
        expect(settings.interface).to.equal('tcp://127.0.0.1:9100');
        expect(settings.characterSet).to.equal('PC858');
        done();
      }, done);
  });

  it('reads a language view of es and still returns the aggregate', done => {
    languageRepository.find(new LanguagePreferencesQuery())
      .flatMap(missing => {
        expect(missing).to.be.instanceof(LanguagePreferencesView);
        expect(missing).to.not.be.instanceof(LanguagePreferences);
        expect(missing.locale).to.equal('es');
        return updateLanguagePreferences.update({locale: 'es'});
      })
      .flatMap(() => languageRepository.find(new LanguagePreferencesQuery()))
      .flatMap(view => languageRepository.findPreferences().map(preferences => ({view, preferences})))
      .subscribe(({view, preferences}) => {
        expect(view.locale).to.equal('es');
        expect(view).to.not.be.instanceof(LanguagePreferences);
        expect(view.withLocale).to.equal(undefined);
        expect(preferences).to.be.instanceof(LanguagePreferences);
        expect(preferences.locale).to.equal('es');
        const row = database.prepare('SELECT value_json FROM setting WHERE key = ?').get('language');
        expect(JSON.parse(row.value_json).locale).to.equal('es');
        done();
      }, done);
  });
});
