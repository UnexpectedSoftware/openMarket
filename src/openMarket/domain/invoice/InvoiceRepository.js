/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('./Invoice').default} Invoice */

/**
 * Port: the shop's invoices, as a collection.
 * Adapters declare `@implements {InvoiceRepository}`; they do not extend this class.
 * @interface
 */
export default class InvoiceRepository {

  /**
   * Inserts an issued invoice. A later save may store a cancellation.
   * The number, the lines, the issue time, and the total are not rewritten.
   * @param {{invoice: Invoice}} params
   * @returns {Observable<Invoice>}
   */
  save({invoice}) {
    throw new Error('InvoiceRepository#save must be implemented');
  }

  /**
   * Completes empty when there is no such invoice.
   * @param {{id: string}} params
   * @returns {Observable<Invoice>}
   */
  findById({id}) {
    throw new Error('InvoiceRepository#findById must be implemented');
  }

  /**
   * Completes empty when the formatted number is unknown.
   * @param {{invoiceNumber: string}} params
   * @returns {Observable<Invoice>}
   */
  findByNumber({invoiceNumber}) {
    throw new Error('InvoiceRepository#findByNumber must be implemented');
  }

  /**
   * Completes empty when the order has no invoice.
   * @param {{orderId: string}} params
   * @returns {Observable<Invoice>}
   */
  findByOrderId({orderId}) {
    throw new Error('InvoiceRepository#findByOrderId must be implemented');
  }

}
