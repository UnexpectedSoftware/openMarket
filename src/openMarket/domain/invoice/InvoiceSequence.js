/** @import { Observable } from 'rxjs/Observable' */
/** @import InvoiceNumber from './InvoiceNumber' */

/**
 * Port: the next invoice number in a series.
 * The call joins the transaction already open on the caller's connection,
 * so a rollback gives the number back.
 * Adapters declare `@implements {InvoiceSequence}`; they do not extend this class.
 * @interface
 */
export default class InvoiceSequence {

  /**
   * @param {{series: string}} params
   * @returns {Observable<InvoiceNumber>}
   */
  next({series}) {
    throw new Error('InvoiceSequence#next must be implemented');
  }

}
