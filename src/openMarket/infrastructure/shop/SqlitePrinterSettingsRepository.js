import * as Rx from 'rxjs';
import PrinterSettings from '../../domain/shop/PrinterSettings';
import PrinterSettingsView from '../../domain/shop/PrinterSettingsView';
import {rethrow} from '../logging/ErrorLog';
import {loadSetting, parseSettingObject} from '../service/readSettingText';
/** @typedef {import('../../domain/shop/PrinterSettingsRepository').default} PrinterSettingsRepository */
/** @typedef {import('../../domain/shop/PrinterSettingsQuery').default} PrinterSettingsQuery */

const KEY = 'printer';
const SAVE_SQL = 'INSERT INTO setting (key, value_json) VALUES (?, ?) ' +
  'ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json';
const INTERFACE_MAX = 200;

/**
 * The `printer` setting. A missing row is Epson on `/dev/usb/lp` with SPAIN1.
 * @implements {PrinterSettingsRepository}
 */
export default class SqlitePrinterSettingsRepository {

  /** @param {{connection: {database: any}}} deps */
  constructor({connection}) {
    this._database = connection.database;
  }

  /**
   * One row. `query` has no fields, so it does not change the read.
   * @param {PrinterSettingsQuery} query
   * @returns {import('rxjs/Observable').Observable<PrinterSettingsView>}
   */
  find(query) {
    return loadSetting(this._database, KEY, 'Could not read the printer settings', viewFromJson, () => new PrinterSettingsView({}));
  }

  /** @returns {import('rxjs/Observable').Observable<PrinterSettings>} */
  findSettings() {
    return loadSetting(this._database, KEY, 'Could not read the printer settings', aggregateFromJson, () => PrinterSettings.defaults());
  }

  /**
   * @param {{settings: PrinterSettings}} params
   * @returns {import('rxjs/Observable').Observable<PrinterSettings>}
   */
  save({settings}) {
    return Rx.Observable.defer(() => {
      const stored = settings instanceof PrinterSettings ? settings : PrinterSettings.defaults();
      const payload = {
        type: stored.type,
        interface: stored.interface,
        characterSet: stored.characterSet
      };
      try {
        this._database.prepare(SAVE_SQL).run(KEY, JSON.stringify(payload));
      } catch (error) {
        rethrow(error, {
          message: 'Could not save the printer settings',
          context: {operation: 'save', type: stored.type}
        });
      }
      return Rx.Observable.of(stored);
    });
  }

}

/**
 * @param {string} text
 * @returns {PrinterSettingsView}
 */
function viewFromJson(text) {
  return new PrinterSettingsView(fieldsFromJson(text));
}

/**
 * @param {string} text
 * @returns {PrinterSettings}
 */
function aggregateFromJson(text) {
  return new PrinterSettings(fieldsFromJson(text));
}

/**
 * @typedef {object} StoredPrinter
 * @property {string} [type]
 * @property {string} [interface]
 * @property {string} [characterSet]
 */

/**
 * @param {string} text
 * @returns {{type: string, interface: string, characterSet: string}}
 */
function fieldsFromJson(text) {
  const data = /** @type {StoredPrinter} */ (parseSettingObject(text, 'Could not read the printer settings'));
  return {
    type: typeFrom(data),
    interface: interfaceFrom(data),
    characterSet: setFrom(data)
  };
}

/**
 * @param {StoredPrinter} data
 * @returns {'epson' | 'star'}
 */
function typeFrom(data) {
  if (data.type === 'star') {
    return 'star';
  }
  return 'epson';
}

/**
 * @param {StoredPrinter} data
 * @returns {string}
 */
function interfaceFrom(data) {
  if (typeof data.interface !== 'string') {
    return '/dev/usb/lp';
  }
  const text = data.interface.trim();
  if (text === '' || text.length > INTERFACE_MAX) {
    return '/dev/usb/lp';
  }
  return text;
}

/**
 * @param {StoredPrinter} data
 * @returns {'SPAIN1' | 'PC858' | 'PC850' | 'WPC1252'}
 */
function setFrom(data) {
  if (data.characterSet === 'PC858' || data.characterSet === 'PC850' || data.characterSet === 'WPC1252') {
    return data.characterSet;
  }
  return 'SPAIN1';
}
