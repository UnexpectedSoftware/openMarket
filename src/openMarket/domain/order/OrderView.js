/**
 * An order as stored, for a screen to read. It carries the row's data and types
 * and does not check sale rules: a row already in the database was valid when it was saved.
 * The write aggregate is `Order`.
 */
export default class OrderView {

  /**
   * @param {{orderId: string, invoiceNumber: string, createdAt: string, itemCount: number, paymentMethod: 'cash'|'card'|null, totalCents: number, cancelled: boolean}} props
   */
  constructor({orderId, invoiceNumber, createdAt, itemCount, paymentMethod, totalCents, cancelled}) {
    this.orderId = orderId;
    this.invoiceNumber = invoiceNumber;
    this.createdAt = createdAt;
    this.itemCount = itemCount;
    this.paymentMethod = paymentMethod;
    this.totalCents = totalCents;
    this.cancelled = cancelled;
    Object.freeze(this);
  }

}
