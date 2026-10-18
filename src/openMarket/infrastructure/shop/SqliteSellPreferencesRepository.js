import * as Rx from 'rxjs';
import SellPreferences from '../../domain/shop/SellPreferences';
import {rethrow} from '../logging/ErrorLog';
/** @typedef {import('../../domain/shop/SellPreferencesRepository').default} SellPreferencesRepository */

const KEY = 'sell_auto_print';
const FIND_SQL = 'SELECT value_json FROM setting WHERE key = ?';
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

  /** @returns {import('rxjs/Observable').Observable<SellPreferences>} */
  find() {
    return Rx.Observable.defer(() => {
      let row;
      try {
        row = this._database.prepare(FIND_SQL).get(KEY);
      } catch (error) {
        rethrow(error, {message: 'Could not read the sell preferences', context: {operation: 'find'}});
      }
      if (!row) {
        return Rx.Observable.of(SellPreferences.defaults());
      }
      return Rx.Observable.of(fromJson(row.value_json));
    });
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
 * @returns {SellPreferences}
 */
function fromJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    rethrow(error, {message: 'Could not read the sell preferences', context: {operation: 'find'}});
  }
  return new SellPreferences({autoPrint: !!(data && data.autoPrint === true)});
}
