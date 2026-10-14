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
   * @param {Array<{barcode: string, name: string, price: number, quantity: number}>} params.lines
   */
  constructor({id, createdAt, lines}) {
    this.id = id;
    this.createdAt = createdAt;
    this.lines = (lines || []).map(line => ({
      barcode: line.barcode,
      name: line.name,
      price: line.price,
      quantity: line.quantity
    }));
  }

}
