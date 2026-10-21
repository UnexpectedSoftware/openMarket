/**
 * Criteria for one page of the orders list. A value passed to `OrderRepository.find`.
 * It describes what to read. It is not a port, and it does not check the range.
 */
export default class OrdersQuery {

  /**
   * @param {{from: string, to: string, limit?: number, offset?: number}} props
   */
  constructor({from, to, limit, offset}) {
    this.from = from;
    this.to = to;
    this.limit = limit;
    this.offset = offset;
    Object.freeze(this);
  }

}
