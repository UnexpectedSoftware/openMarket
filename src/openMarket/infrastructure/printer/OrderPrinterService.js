import * as Rx from 'rxjs';
import 'rxjs/add/operator/defaultIfEmpty';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import SellPreferencesQuery from '../../domain/shop/SellPreferencesQuery';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./EscPosReceiptRenderer').default} EscPosReceiptRenderer */
/** @typedef {import('../../domain/shop/SellPreferencesRepository').default} SellPreferencesRepository */

/**
 * Sends one receipt document to the printer. The blocks are already decided.
 * The paper width comes from the sell preferences (a missing row is 80 mm).
 */
export default class OrderPrinterService {

  /**
   * @param {{printerConnection: {print: Function}, renderer?: EscPosReceiptRenderer, sellPreferencesRepository?: SellPreferencesRepository}} deps
   */
  constructor({printerConnection, renderer, sellPreferencesRepository}) {
    this._connection = printerConnection;
    this._renderer = renderer;
    this._preferences = sellPreferencesRepository || null;
  }

  /**
   * @param {{receipt: {blocks: object[]}}} command
   * @returns {Observable<boolean>}
   */
  print({receipt}) {
    return this._paperWidth().flatMap(paperWidthMm => this._connection.print(printer => {
      this._draw(printer, receipt, paperWidthMm);
    }));
  }

  /** @returns {Observable<number>} */
  _paperWidth() {
    if (!this._preferences) {
      return Rx.Observable.of(80);
    }
    return this._preferences.find(new SellPreferencesQuery())
      .map(view => view && view.paperWidthMm ? view.paperWidthMm : 80)
      .defaultIfEmpty(80);
  }

  /**
   * @param {*} printer
   * @param {{blocks?: object[]}} receipt
   * @param {number} paperWidthMm
   */
  _draw(printer, receipt, paperWidthMm) {
    if (this._renderer) {
      this._renderer.render(printer, receipt, {paperWidthMm});
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
  }

}
