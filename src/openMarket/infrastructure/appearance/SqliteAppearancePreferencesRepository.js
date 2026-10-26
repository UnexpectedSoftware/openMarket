import * as Rx from 'rxjs';
import AppearancePreferences from '../../domain/appearance/AppearancePreferences';
import AppearancePreferencesView from '../../domain/appearance/AppearancePreferencesView';
import {rethrow} from '../logging/ErrorLog';
import {loadSetting} from '../service/readSettingText';
/** @typedef {import('../../domain/appearance/AppearancePreferencesRepository').default} AppearancePreferencesRepository */
/** @typedef {import('../../domain/appearance/AppearancePreferencesQuery').default} AppearancePreferencesQuery */

const KEY = 'appearance';
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

  /**
   * One row. `query` has no fields, so it does not change the read.
   * @param {AppearancePreferencesQuery} query
   * @returns {import('rxjs/Observable').Observable<AppearancePreferencesView>}
   */
  find(query) {
    return loadSetting(this._database, KEY, 'Could not read the appearance', viewFromJson, () => new AppearancePreferencesView({}));
  }

  /** @returns {import('rxjs/Observable').Observable<AppearancePreferences>} */
  findPreferences() {
    return loadSetting(this._database, KEY, 'Could not read the appearance', aggregateFromJson, () => AppearancePreferences.defaults());
  }

  /**
   * @param {{preferences: AppearancePreferences}} params
   * @returns {import('rxjs/Observable').Observable<AppearancePreferences>}
   */
  save({preferences}) {
    return Rx.Observable.defer(() => {
      try {
        this._database.prepare(SAVE_SQL).run(KEY, JSON.stringify({
          theme: preferences.theme.id,
          layout: preferences.layout.id
        }));
      } catch (error) {
        rethrow(error, {
          message: 'Could not save the appearance',
          context: {operation: 'save', theme: preferences.theme.id, layout: preferences.layout.id}
        });
      }
      return Rx.Observable.of(preferences);
    });
  }

}

/**
 * @param {string} text
 * @returns {{theme?: string, layout?: string}}
 */
function appearanceOf(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    rethrow(error, {message: 'Could not read the appearance', context: {operation: 'find'}});
  }
  if (!data || typeof data !== 'object') {
    return {};
  }
  return data;
}

/**
 * @param {string} text
 * @returns {AppearancePreferencesView}
 */
function viewFromJson(text) {
  const data = appearanceOf(text);
  return new AppearancePreferencesView({theme: data.theme, layout: data.layout});
}

/**
 * @param {string} text
 * @returns {AppearancePreferences}
 */
function aggregateFromJson(text) {
  const data = appearanceOf(text);
  return new AppearancePreferences({theme: data.theme, layout: data.layout});
}
