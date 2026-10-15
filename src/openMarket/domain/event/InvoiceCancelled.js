/**
 * An issued invoice was cancelled. The number and the lines are the issued snapshot.
 */
export default class InvoiceCancelled {

  static get type() {
    return 'InvoiceCancelled';
  }

  /**
   * Stored even before a durable subscriber exists.
   * @returns {boolean}
   */
  static get durable() {
    return true;
  }

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.series
   * @param {number} params.number
   * @param {string} params.invoiceNumber
   * @param {string} params.issuedAt
   * @param {string} params.cancelledAt
   * @param {string | null} params.orderId
   * @param {Array<{barcode: string, name: string, price: number, quantity: number, amount: number}>} params.lines
   * @param {number} params.total
   */
  constructor({id, series, number, invoiceNumber, issuedAt, cancelledAt, orderId, lines, total}) {
    this.id = id;
    this.series = series;
    this.number = number;
    this.invoiceNumber = invoiceNumber;
    this.issuedAt = issuedAt;
    this.cancelledAt = cancelledAt;
    this.orderId = orderId == null ? null : orderId;
    this.lines = (lines || []).map(line => ({
      barcode: line.barcode,
      name: line.name,
      price: line.price,
      quantity: line.quantity,
      amount: line.amount
    }));
    this.total = total;
  }

}
