import * as Rx from 'rxjs';
import LanguagePreferences from '../../domain/shop/LanguagePreferences';
import LanguagePreferencesView from '../../domain/shop/LanguagePreferencesView';
import {rethrow} from '../logging/ErrorLog';
import {loadSetting, parseSettingObject} from '../service/readSettingText';
/** @typedef {import('../../domain/shop/LanguagePreferencesRepository').default} LanguagePreferencesRepository */
/** @typedef {import('../../domain/shop/LanguagePreferencesQuery').default} LanguagePreferencesQuery */

const KEY = 'language';
const SAVE_SQL = 'INSERT INTO setting (key, value_json) VALUES (?, ?) ' +
  'ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json';

/**
 * The `language` setting. A missing row, and any locale other than `es`, is `es`.
 * @implements {LanguagePreferencesRepository}
 */
export default class SqliteLanguagePreferencesRepository {

  /** @param {{connection: {database: any}}} deps */
  constructor({connection}) {
    this._database = connection.database;
  }

  /**
   * One row. `query` has no fields, so it does not change the read.
   * @param {LanguagePreferencesQuery} query
   * @returns {import('rxjs/Observable').Observable<LanguagePreferencesView>}
   */
  find(query) {
    return loadSetting(this._database, KEY, 'Could not read the language', viewFromJson, () => new LanguagePreferencesView({}));
  }

  /** @returns {import('rxjs/Observable').Observable<LanguagePreferences>} */
  findPreferences() {
    return loadSetting(this._database, KEY, 'Could not read the language', aggregateFromJson, () => LanguagePreferences.defaults());
  }

  /**
   * @param {{preferences: LanguagePreferences}} params
   * @returns {import('rxjs/Observable').Observable<LanguagePreferences>}
   */
  save({preferences}) {
    return Rx.Observable.defer(() => {
      const stored = preferences instanceof LanguagePreferences ? preferences : LanguagePreferences.defaults();
      try {
        this._database.prepare(SAVE_SQL).run(KEY, JSON.stringify({locale: stored.locale}));
      } catch (error) {
        rethrow(error, {
          message: 'Could not save the language',
          context: {operation: 'save', locale: stored.locale}
        });
      }
      return Rx.Observable.of(stored);
    });
  }

}

/**
 * @param {string} text
 * @returns {LanguagePreferencesView}
 */
function viewFromJson(text) {
  return new LanguagePreferencesView({locale: localeFrom(text)});
}

/**
 * @param {string} text
 * @returns {LanguagePreferences}
 */
function aggregateFromJson(text) {
  return new LanguagePreferences({locale: localeFrom(text)});
}

/**
 * The screen stores `es`. A row with any other locale still reads as `es`,
 * and a corrupt row fails the read. Parsing keeps that failure.
 * @param {string} text
 * @returns {'es'}
 */
function localeFrom(text) {
  parseSettingObject(text, 'Could not read the language');
  return 'es';
}
