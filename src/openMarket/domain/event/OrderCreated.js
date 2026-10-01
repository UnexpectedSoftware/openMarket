/**
 * A sale was stored. Lines are a snapshot so later edits do not change the event.
 */
export default class OrderCreated {

  /**
   * @param {string} id
   * @param {string} createdAt
   * @param {Array.<{barcode: string, name: string, price: number, quantity: number}>} lines
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
