/** @import { Observable } from 'rxjs/Observable' */

/**
 * Sends a built receipt to the ticket printer.
 */
export default class PrintReceipt {

  /**
   * @param {{orderPrinterService: {print: Function}}} deps
   */
  constructor({orderPrinterService}) {
    this._printer = orderPrinterService;
  }

  /**
   * @param {{receipt: {blocks: object[]}}} command
   * @returns {Observable<boolean>}
   */
  print({receipt}) {
    return this._printer.print({receipt});
  }

}
