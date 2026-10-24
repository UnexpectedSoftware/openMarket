/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./AppearancePreferences').default} AppearancePreferences */
/** @typedef {import('./AppearancePreferencesQuery').default} AppearancePreferencesQuery */
/** @typedef {import('./AppearancePreferencesView').default} AppearancePreferencesView */

/**
 * Port: the till's appearance, as one stored preference.
 * @interface
 */
export default class AppearancePreferencesRepository {

  /**
   * The stored preferences as a screen reads them. A missing row is Mercado.
   * It does not complete empty.
   * @param {AppearancePreferencesQuery} query
   * @returns {Observable<AppearancePreferencesView>}
   */
  find(query) {
    throw new Error('AppearancePreferencesRepository#find must be implemented');
  }

  /**
   * The write aggregate, or Mercado when the row has never been saved.
   * @returns {Observable<AppearancePreferences>}
   */
  findPreferences() {
    throw new Error('AppearancePreferencesRepository#findPreferences must be implemented');
  }

  /**
   * @param {{preferences: AppearancePreferences}} params
   * @returns {Observable<AppearancePreferences>}
   */
  save({preferences}) {
    throw new Error('AppearancePreferencesRepository#save must be implemented');
  }

}
