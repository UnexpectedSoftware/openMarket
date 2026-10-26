import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/defer';
import PrinterSettingsQuery from '../../../domain/shop/PrinterSettingsQuery';
/** @typedef {import('../../../domain/shop/PrinterSettingsRepository').default} PrinterSettingsRepository */
/** @typedef {import('../../../domain/shop/PrinterSettingsView').default} PrinterSettingsView */

/**
 * Reads the till's printer: type, interface, and character set.
 */
export default class GetPrinterSettings {

  /** @param {{printerSettingsRepository: PrinterSettingsRepository}} deps */
  constructor({printerSettingsRepository}) {
    this._printerSettingsRepository = printerSettingsRepository;
  }

  /** @returns {import('rxjs/Observable').Observable<PrinterSettingsView>} */
  get() {
    return Observable.defer(() => this._printerSettingsRepository.find(new PrinterSettingsQuery()));
  }

}
