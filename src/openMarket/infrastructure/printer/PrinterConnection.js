import printer from 'node-thermal-printer';
import * as Rx from 'rxjs';
import PrinterBusyError from '../../domain/error/PrinterBusyError';

export default class PrinterConnection {
  constructor({device} = {}) {
    if (device) {
      this._printer = device;
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
   * @param {function} fill
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
