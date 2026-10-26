/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./LanguagePreferences').default} LanguagePreferences */
/** @typedef {import('./LanguagePreferencesQuery').default} LanguagePreferencesQuery */
/** @typedef {import('./LanguagePreferencesView').default} LanguagePreferencesView */

/**
 * Port: the till's locale, as one stored setting.
 * @interface
 */
export default class LanguagePreferencesRepository {

  /**
   * The stored locale as a screen reads it. A missing row is the default view.
   * It does not complete empty.
   * @param {LanguagePreferencesQuery} query
   * @returns {Observable<LanguagePreferencesView>}
   */
  find(query) {
    throw new Error('LanguagePreferencesRepository#find must be implemented');
  }

  /**
   * The write aggregate, or the default when the key has never been saved.
   * @returns {Observable<LanguagePreferences>}
   */
  findPreferences() {
    throw new Error('LanguagePreferencesRepository#findPreferences must be implemented');
  }

  /**
   * @param {{preferences: LanguagePreferences}} params
   * @returns {Observable<LanguagePreferences>}
   */
  save({preferences}) {
    throw new Error('LanguagePreferencesRepository#save must be implemented');
  }

}
