/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./SellPreferences').default} SellPreferences */

/**
 * Port: whether the till prints a ticket on its own.
 * @interface
 */
export default class SellPreferencesRepository {

  /**
   * The stored preference, or the default when the key has never been saved.
   * @returns {Observable<SellPreferences>}
   */
  find() {
    throw new Error('SellPreferencesRepository#find must be implemented');
  }

  /**
   * @param {{preferences: SellPreferences}} params
   * @returns {Observable<SellPreferences>}
   */
  save({preferences}) {
    throw new Error('SellPreferencesRepository#save must be implemented');
  }

}
