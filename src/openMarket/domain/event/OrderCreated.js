/**
 * A sale was stored. Lines are a snapshot so later edits do not change the event.
 */
export default class OrderCreated {

  static get type() {
    return 'OrderCreated';
  }

  /**
   * Stored even before a durable subscriber exists, so a later registration
   * can still ignore sales from before it was enabled.
   * @returns {boolean}
   */
  static get durable() {
    return true;
  }

  /**
   * @param {object} params
   * @param {string} params.id
   * @param {string} params.createdAt
   * @param {Array<{barcode: string, name: string, price: number, quantity: number, amount?: number, priceCents?: number, quantityMilli?: number, amountCents?: number}>} params.lines
   */
  constructor({id, createdAt, lines}) {
    this.id = id;
    this.createdAt = createdAt;
    this.lines = (lines || []).map(line => lineWithCents(line));
  }

}

/**
 * Copies a line. Cent fields are included only when the caller passed them.
 * @param {{barcode: string, name: string, price: number, quantity: number, amount?: number, priceCents?: number, quantityMilli?: number, amountCents?: number}} line
 * @returns {object}
 */
function lineWithCents(line) {
  const copy = {
    barcode: line.barcode,
    name: line.name,
    price: line.price,
    quantity: line.quantity
  };
  if (line.amount != null) {
    copy.amount = line.amount;
  }
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
