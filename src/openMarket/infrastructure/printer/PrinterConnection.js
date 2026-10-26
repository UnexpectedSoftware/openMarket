import fs from 'fs';
import path from 'path';
import printer from 'node-thermal-printer';
import * as Rx from 'rxjs';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import PrinterBusyError from '../../domain/error/PrinterBusyError';
import PrinterSettingsQuery from '../../domain/shop/PrinterSettingsQuery';
import PrinterSettingsView from '../../domain/shop/PrinterSettingsView';
import {userDataDirectory} from '../service/sqliteDatabasePath';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../domain/shop/PrinterSettingsRepository').default} PrinterSettingsRepository */

/**
 * Subset of node-thermal-printer used by the ticket and catalog jobs.
 * @typedef {object} ThermalPrinter
 * @property {() => void} clear
 * @property {(callback: (err: unknown) => void) => void} execute
 * @property {() => void} alignCenter
 * @property {() => void} alignLeft
 * @property {() => void} alignRight
 * @property {(text: string) => void} println
 * @property {(text: string | number) => void} print
 * @property {() => void} drawLine
 * @property {() => void} cut
 * @property {() => void} newLine
 * @property {() => void} setTextDoubleHeight
 * @property {() => void} setTextDoubleWidth
 * @property {() => void} setTextNormal
 * @property {(enabled: boolean) => void} bold
 * @property {(columns: {text?: string | number, align?: string, width?: number, bold?: boolean}[]) => void} tableCustom
 * @property {(data: string, options?: {cellSize?: number, correction?: string, model?: number}) => void} [printQR]
 */

/**
 * Records each call so a test can see the ticket without a device.
 * @returns {ThermalPrinter}
 */
function recordingPrinter() {
  const directory = userDataDirectory() || path.join(process.cwd(), 'test-results');
  fs.mkdirSync(directory, {recursive: true});
  const logFile = path.join(directory, 'printer-log.jsonl');
  const note = (name, args) => {
    fs.appendFileSync(logFile, JSON.stringify({name, args}) + '\n');
  };
  return {
    clear() { note('clear', []); },
    execute(callback) {
      note('execute', []);
      callback(null);
    },
    alignCenter() { note('alignCenter', []); },
    alignLeft() { note('alignLeft', []); },
    alignRight() { note('alignRight', []); },
    println(text) { note('println', [String(text)]); },
    print(text) { note('print', [String(text)]); },
    drawLine() { note('drawLine', []); },
    cut() { note('cut', []); },
    newLine() { note('newLine', []); },
    setTextDoubleHeight() { note('setTextDoubleHeight', []); },
    setTextDoubleWidth() { note('setTextDoubleWidth', []); },
    setTextNormal() { note('setTextNormal', []); },
    bold(enabled) { note('bold', [Boolean(enabled)]); },
    tableCustom(cells) { note('tableCustom', [cells]); },
    printQR(data, options) { note('printQR', [data, options]); }
  };
}

export default class PrinterConnection {
  /**
   * `device` and `OPENMARKET_FAKE_PRINTER=1` skip `init`. Otherwise the first
   * job, and any later job whose type, interface, or character set changed,
   * calls `init` with the stored printer view.
   * @param {object} [options]
   * @param {ThermalPrinter} [options.device]
   * @param {PrinterSettingsRepository} [options.printerSettingsRepository]
   * @param {{init: Function}} [options.thermalPrinter]
   */
  constructor({device, printerSettingsRepository, thermalPrinter} = {}) {
    this._injected = device || null;
    this._settings = printerSettingsRepository || null;
    this._thermal = thermalPrinter || printer;
    this._fake = !device && process.env.OPENMARKET_FAKE_PRINTER === '1';
    if (device) {
      this._printer = device;
    } else if (this._fake) {
      this._printer = recordingPrinter();
    } else {
      this._printer = this._thermal;
    }
    this._busy = false;
    /** @type {{type: string, interface: string, characterSet: string} | null} */
    this._applied = null;
  }

  get printer() {
    return this._printer;
  }

  /**
   * Clears the shared buffer, lets fill append one job, and completes when the device accepts it.
   * @param {(printer: ThermalPrinter) => void} fill
   * @returns {Observable<boolean>}
   */
  print(fill) {
    if (this._busy) {
      return Rx.Observable.throw(new PrinterBusyError());
    }
    this._busy = true;
    return this._prepare()
      .catch(error => {
        this._busy = false;
        return Rx.Observable.throw(error);
      })
      .mergeMap(() => this._run(fill));
  }

  /**
   * Reads the stored printer and calls `init` when the device settings changed.
   * @returns {Observable<null>}
   */
  _prepare() {
    if (this._injected || this._fake) {
      return Rx.Observable.of(null);
    }
    return this._loadSettings().map(settings => {
      this._apply(settings);
      return null;
    });
  }

  /** @returns {Observable<PrinterSettingsView>} */
  _loadSettings() {
    if (!this._settings || typeof this._settings.find !== 'function') {
      return Rx.Observable.of(new PrinterSettingsView({}));
    }
    return this._settings.find(new PrinterSettingsQuery())
      .map(view => view || new PrinterSettingsView({}))
      .defaultIfEmpty(new PrinterSettingsView({}));
  }

  /**
   * @param {PrinterSettingsView} settings
   */
  _apply(settings) {
    const type = settings && settings.type ? settings.type : 'epson';
    const device = settings && settings.interface ? settings.interface : '/dev/usb/lp';
    const characterSet = settings && settings.characterSet ? settings.characterSet : 'SPAIN1';
    if (sameDevice(this._applied, type, device, characterSet)) {
      return;
    }
    this._thermal.init({
      type,
      interface: device,
      characterSet,
      extraSpecialCharacters: {'€': 128}
    });
    this._applied = {type, interface: device, characterSet};
  }

  /**
   * @param {(printer: ThermalPrinter) => void} fill
   * @returns {Observable<boolean>}
   */
  _run(fill) {
    return Rx.Observable.create(observer => {
      let settled = false;
      const finish = (error) => {
        if (settled) {
          return;
        }
        settled = true;
        this._busy = false;
        if (error) {
          observer.error(error);
          return;
        }
        observer.next(true);
        observer.complete();
      };
      try {
        this._printer.clear();
        fill(this._printer);
        this._printer.execute((err) => {
          if (err) {
            finish(err instanceof Error ? err : new Error(String(err)));
            return;
          }
          finish(null);
        });
      } catch (error) {
        finish(error);
      }
    });
  }
}

/**
 * @param {{type: string, interface: string, characterSet: string} | null} applied
 * @param {string} type
 * @param {string} device
 * @param {string} characterSet
 * @returns {boolean}
 */
function sameDevice(applied, type, device, characterSet) {
  return !!applied && applied.type === type && applied.interface === device && applied.characterSet === characterSet;
}
