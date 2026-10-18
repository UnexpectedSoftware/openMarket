import * as Rx from 'rxjs';
import AppearancePreferences from '../../domain/appearance/AppearancePreferences';
import {rethrow} from '../logging/ErrorLog';
/** @typedef {import('../../domain/appearance/AppearancePreferencesRepository').default} AppearancePreferencesRepository */

const KEY = 'appearance';
const FIND_SQL = 'SELECT value_json FROM setting WHERE key = ?';
const SAVE_SQL = 'INSERT INTO setting (key, value_json) VALUES (?, ?) ' +
  'ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json';

/**
 * The till theme stored as one JSON setting.
 * @implements {AppearancePreferencesRepository}
 */
export default class SqliteAppearancePreferencesRepository {

  /**
   * @param {{connection: {database: any}}} deps
   */
  constructor({connection}) {
    this._database = connection.database;
  }

  /** @returns {import('rxjs/Observable').Observable<AppearancePreferences>} */
  find() {
    return Rx.Observable.defer(() => {
      let row;
      try {
        row = this._database.prepare(FIND_SQL).get(KEY);
      } catch (error) {
        rethrow(error, {message: 'Could not read the appearance', context: {operation: 'find'}});
      }
      if (!row) {
        return Rx.Observable.of(AppearancePreferences.defaults());
      }
      return Rx.Observable.of(fromJson(row.value_json));
    });
  }

  /**
   * @param {{preferences: AppearancePreferences}} params
   * @returns {import('rxjs/Observable').Observable<AppearancePreferences>}
   */
  save({preferences}) {
    return Rx.Observable.defer(() => {
      try {
        this._database.prepare(SAVE_SQL).run(KEY, JSON.stringify({theme: preferences.theme.id}));
      } catch (error) {
        rethrow(error, {
          message: 'Could not save the appearance',
          context: {operation: 'save', theme: preferences.theme.id}
        });
      }
      return Rx.Observable.of(preferences);
    });
  }

}

/**
 * @param {string} text
 * @returns {AppearancePreferences}
 */
function fromJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    rethrow(error, {message: 'Could not read the appearance', context: {operation: 'find'}});
  }
  return new AppearancePreferences({theme: data && data.theme});
}
