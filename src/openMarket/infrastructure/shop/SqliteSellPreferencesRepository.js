import * as Rx from 'rxjs';
import SellPreferences from '../../domain/shop/SellPreferences';
import SellPreferencesView from '../../domain/shop/SellPreferencesView';
import {rethrow} from '../logging/ErrorLog';
import {loadSetting} from '../service/readSettingText';
/** @typedef {import('../../domain/shop/SellPreferencesRepository').default} SellPreferencesRepository */
/** @typedef {import('../../domain/shop/SellPreferencesQuery').default} SellPreferencesQuery */

const KEY = 'sell_auto_print';
const SAVE_SQL = 'INSERT INTO setting (key, value_json) VALUES (?, ?) ' +
  'ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json';

/**
 * The `sell_auto_print` setting. A missing row asks before printing.
 * A stored `{autoPrint: true}` with no print mode is `always`. Anything else
 * without a print mode is `ask`.
 * @implements {SellPreferencesRepository}
 */
export default class SqliteSellPreferencesRepository {

  /** @param {{connection: {database: any}}} deps */
  constructor({connection}) {
    this._database = connection.database;
  }

  /**
   * One row. `query` has no fields, so it does not change the read.
   * @param {SellPreferencesQuery} query
   * @returns {import('rxjs/Observable').Observable<SellPreferencesView>}
   */
  find(query) {
    return loadSetting(this._database, KEY, 'Could not read the sell preferences', viewFromJson, () => new SellPreferencesView({}));
  }

  /** @returns {import('rxjs/Observable').Observable<SellPreferences>} */
  findPreferences() {
    return loadSetting(this._database, KEY, 'Could not read the sell preferences', aggregateFromJson, () => SellPreferences.defaults());
  }

  /**
   * @param {{preferences: SellPreferences}} params
   * @returns {import('rxjs/Observable').Observable<SellPreferences>}
   */
  save({preferences}) {
    return Rx.Observable.defer(() => {
      const stored = preferences instanceof SellPreferences ? preferences : SellPreferences.defaults();
      const payload = {
        printMode: stored.printMode,
        headerText: stored.headerText,
        footerText: stored.footerText,
        paperWidthMm: stored.paperWidthMm
      };
      try {
        this._database.prepare(SAVE_SQL).run(KEY, JSON.stringify(payload));
      } catch (error) {
        rethrow(error, {
          message: 'Could not save the sell preferences',
          context: {operation: 'save', printMode: stored.printMode}
        });
      }
      return Rx.Observable.of(stored);
    });
  }

}

/**
 * @param {string} text
 * @returns {SellPreferencesView}
 */
function viewFromJson(text) {
  return new SellPreferencesView(fieldsFromJson(text));
}

/**
 * @param {string} text
 * @returns {SellPreferences}
 */
function aggregateFromJson(text) {
  return new SellPreferences(fieldsFromJson(text));
}

/**
 * @param {string} text
 * @returns {{printMode: string, headerText: string, footerText: string, paperWidthMm: number}}
 */
function fieldsFromJson(text) {
  const data = parsed(text);
  return {
    printMode: modeFrom(data),
    headerText: textField(data.headerText),
    footerText: textField(data.footerText),
    paperWidthMm: widthFrom(data)
  };
}

/**
 * @typedef {object} StoredSellPreferences
 * @property {string} [printMode]
 * @property {boolean} [autoPrint]
 * @property {string} [headerText]
 * @property {string} [footerText]
 * @property {number} [paperWidthMm]
 */

/**
 * @param {string} text
 * @returns {StoredSellPreferences}
 */
function parsed(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    rethrow(error, {message: 'Could not read the sell preferences', context: {operation: 'find'}});
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }
  return /** @type {StoredSellPreferences} */ (data);
}

/**
 * A row that already has a print mode keeps it. `{autoPrint: true}` and no
 * mode is always. Every other legacy row asks.
 * @param {StoredSellPreferences} data
 * @returns {'always' | 'ask' | 'never'}
 */
function modeFrom(data) {
  if (data.printMode === 'always' || data.printMode === 'ask' || data.printMode === 'never') {
    return data.printMode;
  }
  if (data.printMode == null && data.autoPrint === true) {
    return 'always';
  }
  return 'ask';
}

/**
 * @param {StoredSellPreferences} data
 * @returns {58 | 80}
 */
function widthFrom(data) {
  if (data.paperWidthMm === 58 || data.paperWidthMm === 80) {
    return data.paperWidthMm;
  }
  return 80;
}

/**
 * @param {*} value
 * @returns {string}
 */
function textField(value) {
  return typeof value === 'string' ? value : '';
}
