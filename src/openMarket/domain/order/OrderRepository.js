/**
 * @interface
 */
export default class OrderRepository {


  /**
   * @param {string} id
   */
  findById({ id }) {
    throw new Error('OrderRepository#order must be implemented');
  }

  /**
   *
   * @param {number} limit
   * @param {number} offset
   */
  findAll({ limit, offset }) {
    throw new Error('OrderRepository#order must be implemented');
  }

  /**
   *
   * @param {string} id
   * @param {} lines
   */
  update({ id, lines }) {
    throw new Error('OrderRepository#order must be implemented');
  }

  /**
   *
   * @param {Array} lines
   * @returns {Observable.<null>}
   */
  save({ lines }) {
    throw new Error('OrderRepository#order must be implemented');
  }


}
