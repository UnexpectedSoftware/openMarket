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
 * The `sell_auto_print` setting. Missing row means do not print on its own.
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
      try {
        this._database.prepare(SAVE_SQL).run(KEY, JSON.stringify({autoPrint: stored.autoPrint}));
      } catch (error) {
        rethrow(error, {
          message: 'Could not save the sell preferences',
          context: {operation: 'save', autoPrint: stored.autoPrint}
        });
      }
      return Rx.Observable.of(stored);
    });
  }

}

/**
 * @param {string} text
 * @returns {boolean}
 */
function autoPrintOf(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    rethrow(error, {message: 'Could not read the sell preferences', context: {operation: 'find'}});
  }
  return !!(data && data.autoPrint === true);
}

/**
 * @param {string} text
 * @returns {SellPreferencesView}
 */
function viewFromJson(text) {
  return new SellPreferencesView({autoPrint: autoPrintOf(text)});
}

/**
 * @param {string} text
 * @returns {SellPreferences}
 */
function aggregateFromJson(text) {
  return new SellPreferences({autoPrint: autoPrintOf(text)});
}
