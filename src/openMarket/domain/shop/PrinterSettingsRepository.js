/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./PrinterSettings').default} PrinterSettings */
/** @typedef {import('./PrinterSettingsQuery').default} PrinterSettingsQuery */
/** @typedef {import('./PrinterSettingsView').default} PrinterSettingsView */

/**
 * Port: the till's thermal printer, as one stored setting.
 * @interface
 */
export default class PrinterSettingsRepository {

  /**
   * The stored printer as a screen reads it. A missing row is the default view.
   * It does not complete empty.
   * @param {PrinterSettingsQuery} query
   * @returns {Observable<PrinterSettingsView>}
   */
  find(query) {
    throw new Error('PrinterSettingsRepository#find must be implemented');
  }

  /**
   * The write aggregate, or the default when the key has never been saved.
   * @returns {Observable<PrinterSettings>}
   */
  findSettings() {
    throw new Error('PrinterSettingsRepository#findSettings must be implemented');
  }

  /**
   * @param {{settings: PrinterSettings}} params
   * @returns {Observable<PrinterSettings>}
   */
  save({settings}) {
    throw new Error('PrinterSettingsRepository#save must be implemented');
  }

}
