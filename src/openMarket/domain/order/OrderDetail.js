/**
 * @typedef {object} DetailPayment
 * @property {'cash' | 'card' | 'bizum' | 'mixed'} method
 * @property {number | null} tenderedCents
 * @property {number | null} changeCents
 * @property {Array<{method: string, amountCents: number}>} [parts]
 */

/**
 * One invoiced order as stored, for the detail screen.
 * Lines and VAT are the invoice rows. It does not check sale rules:
 * a row already in the database was valid when it was saved.
 * The write aggregate is `Order`. The list row is `OrderView`.
 */
export default class OrderDetail {

  /**
   * @param {{orderId: string, invoiceNumber: string, invoiceType: string | null, cancelled: boolean, createdAt: string, payment: DetailPayment | null, lines: object[], vat: object[], totalCents: number}} props
   */
  constructor({orderId, invoiceNumber, invoiceType, cancelled, createdAt, payment, lines, vat, totalCents}) {
    this.orderId = orderId;
    this.invoiceNumber = invoiceNumber;
    this.invoiceType = invoiceType;
    this.cancelled = cancelled;
    this.createdAt = createdAt;
    this.payment = payment;
    this.lines = lines;
    this.vat = vat;
    this.totalCents = totalCents;
    Object.freeze(this);
  }

}
