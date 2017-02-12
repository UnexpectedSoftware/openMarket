/**
 * @class CreateOrder
 */
export default class CreateOrder {

  /**
   *
   * @param {OrderRepository} repository
   */
  constructor({ repository }) {
    this.repository = repository;
  }

  /**
   * Create a new Order with all lines
   * @param lines
   * @returns {Observable.<null>}
   */
  createOrder({lines}) {
    return this.repository.save({ lines });
  }

}
