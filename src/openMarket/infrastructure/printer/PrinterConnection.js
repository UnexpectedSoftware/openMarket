import fs from 'fs';
import path from 'path';
import printer from 'node-thermal-printer';
import * as Rx from 'rxjs';
import PrinterBusyError from '../../domain/error/PrinterBusyError';
import {userDataDirectory} from '../service/sqliteDatabasePath';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */

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
   * @param {{device?: ThermalPrinter}} [options]
   */
  constructor({device} = {}) {
    if (device) {
      this._printer = device;
    } else if (process.env.OPENMARKET_FAKE_PRINTER === '1') {
      this._printer = recordingPrinter();
    } else {
      printer.init({
        type: 'epson',
        interface: '/dev/usb/lp',
        characterSet: 'SPAIN1',
        extraSpecialCharacters: {'€': 128}
      });
      this._printer = printer;
    }
    this._busy = false;
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
