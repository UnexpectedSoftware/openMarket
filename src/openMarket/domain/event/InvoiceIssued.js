/**
 * An invoice was issued. Lines are a snapshot so a later change to a product
 * or to the source order does not change this document.
 */
export default class InvoiceIssued {

  static get type() {
    return 'InvoiceIssued';
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
   * @param {string | null} params.orderId
   * @param {Array<{barcode: string, name: string, price: number, quantity: number, amount: number, priceCents?: number, quantityMilli?: number, amountCents?: number}>} params.lines
   * @param {number} params.total
   * @param {number} [params.totalCents]
   */
  constructor({id, series, number, invoiceNumber, issuedAt, orderId, lines, total, totalCents}) {
    this.id = id;
    this.series = series;
    this.number = number;
    this.invoiceNumber = invoiceNumber;
    this.issuedAt = issuedAt;
    this.orderId = orderId == null ? null : orderId;
    this.lines = (lines || []).map(line => lineWithCents(line));
    this.total = total;
    if (totalCents != null) {
      this.totalCents = totalCents;
    }
  }

}

/**
 * @param {{barcode: string, name: string, price: number, quantity: number, amount: number, priceCents?: number, quantityMilli?: number, amountCents?: number}} line
 * @returns {object}
 */
function lineWithCents(line) {
  const copy = {
    barcode: line.barcode,
    name: line.name,
    price: line.price,
    quantity: line.quantity,
    amount: line.amount
  };
  if (line.priceCents != null) {
    copy.priceCents = line.priceCents;
  }
  if (line.quantityMilli != null) {
    copy.quantityMilli = line.quantityMilli;
  }
  if (line.amountCents != null) {
    copy.amountCents = line.amountCents;
  }
  return copy;
}
