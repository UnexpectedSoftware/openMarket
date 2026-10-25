/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./SellPreferences').default} SellPreferences */
/** @typedef {import('./SellPreferencesQuery').default} SellPreferencesQuery */
/** @typedef {import('./SellPreferencesView').default} SellPreferencesView */

/**
 * Port: how the till prints a ticket.
 * @interface
 */
export default class SellPreferencesRepository {

  /**
   * The stored preference as a screen reads it. A missing row is the default view.
   * It does not complete empty.
   * @param {SellPreferencesQuery} query
   * @returns {Observable<SellPreferencesView>}
   */
  find(query) {
    throw new Error('SellPreferencesRepository#find must be implemented');
  }

  /**
   * The write aggregate, or the default when the key has never been saved.
   * @returns {Observable<SellPreferences>}
   */
  findPreferences() {
    throw new Error('SellPreferencesRepository#findPreferences must be implemented');
  }

  /**
   * @param {{preferences: SellPreferences}} params
   * @returns {Observable<SellPreferences>}
   */
  save({preferences}) {
    throw new Error('SellPreferencesRepository#save must be implemented');
  }

}
