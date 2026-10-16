import 'rxjs/add/operator/map';
/** @import { Observable } from 'rxjs/Observable' */
/** @import EscPosReceiptRenderer from './EscPosReceiptRenderer' */

/**
 * Sends one receipt document to the printer. The blocks are already decided.
 */
export default class OrderPrinterService {

  /**
   * @param {{printerConnection: {print: Function}, renderer?: EscPosReceiptRenderer}} deps
   */
  constructor({printerConnection, renderer}) {
    this._connection = printerConnection;
    this._renderer = renderer;
  }

  /**
   * @param {{receipt: {blocks: object[]}}} command
   * @returns {Observable<boolean>}
   */
  print({receipt}) {
    return this._connection.print(printer => {
      if (this._renderer) {
        this._renderer.render(printer, receipt);
        return;
      }
      /** @type {Array<*>} */
      const blocks = receipt && receipt.blocks ? receipt.blocks : [];
      blocks.forEach(block => {
        if (block.type === 'text') {
          printer.println(block.text);
        }
      });
      printer.cut();
    });
  }

}
