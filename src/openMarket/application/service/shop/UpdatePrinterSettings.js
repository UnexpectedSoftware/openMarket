import 'rxjs/add/operator/mergeMap';
/** @typedef {import('../../../domain/shop/PrinterSettingsRepository').default} PrinterSettingsRepository */
/** @typedef {import('../../../domain/shop/PrinterSettings').default} PrinterSettings */

/**
 * Stores the till's printer. It does not open the device.
 * An empty interface fails with `PRINTER_SETTINGS_INVALID`.
 */
export default class UpdatePrinterSettings {

  /** @param {{printerSettingsRepository: PrinterSettingsRepository}} deps */
  constructor({printerSettingsRepository}) {
    this._printerSettingsRepository = printerSettingsRepository;
  }

  /**
   * @param {object} command
   * @param {string} command.type
   * @param {string} command.interface
   * @param {string} command.characterSet
   * @returns {import('rxjs/Observable').Observable<PrinterSettings>}
   */
  update({type, interface: device, characterSet}) {
    return this._printerSettingsRepository.findSettings()
      .flatMap(settings => this._printerSettingsRepository.save({
        settings: settings
          .withType(type)
          .withInterface(device)
          .withCharacterSet(characterSet)
      }));
  }

}
