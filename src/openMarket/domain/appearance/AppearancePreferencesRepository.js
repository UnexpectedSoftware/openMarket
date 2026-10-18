/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./AppearancePreferences').default} AppearancePreferences */

/**
 * Port: the till's appearance, as one stored preference.
 * @interface
 */
export default class AppearancePreferencesRepository {

  /**
   * The stored preferences, or Mercado when the row has never been saved.
   * @returns {Observable<AppearancePreferences>}
   */
  find() {
    throw new Error('AppearancePreferencesRepository#find must be implemented');
  }

  /**
   * @param {{preferences: AppearancePreferences}} params
   * @returns {Observable<AppearancePreferences>}
   */
  save({preferences}) {
    throw new Error('AppearancePreferencesRepository#save must be implemented');
  }

}
