import 'rxjs/add/operator/map';
/** @typedef {import('../../../domain/invoice/InvoiceSequence').default} InvoiceSequence */
/** @typedef {import('../../../domain/Clock').default} Clock */

/**
 * The formatted number checkout can show. It does not allocate that number.
 */
export default class PeekNextInvoiceNumber {

  /**
   * @param {{invoiceSequence: InvoiceSequence, clock: Clock}} deps
   */
  constructor({invoiceSequence, clock}) {
    this._invoiceSequence = invoiceSequence;
    this._clock = clock;
  }

  /**
   * @returns {Observable<string>}
   */
  peek() {
    const zoned = this._clock && typeof this._clock.zonedNow === 'function'
      ? this._clock.zonedNow()
      : null;
    const series = zoned && zoned.date ? String(zoned.date).slice(0, 4) : '';
    return this._invoiceSequence.peek({series}).map(number => number.formatted);
  }

}
