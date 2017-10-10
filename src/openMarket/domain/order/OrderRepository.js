/**
 * @interface
 */
export default class OrderRepository {


  /**
   * @param {string} id
   */
  findById({ id }) {
    throw new Error('OrderRepository#findById must be implemented');
  }

  /**
   *
   * @param limit
   * @param offset
   * @param startDate
   * @param endDate
   */
  findAllByDates({ limit, offset, startDate, endDate }) {
    throw new Error('OrderRepository#findAllByDates must be implemented');
  }

  countByDates({ startDate, endDate }){
    throw new Error('OrderRepository#countByDates must be implemented');
  }

  calculateTotalAmount({startDate, endDate}){
    throw new Error('OrderRepository#calculateTotalAmount must be implemented');
  }
  calculateTotalAmountByDays({startDate, endDate}){
    throw new Error('OrderRepository#calculateTotalAmountByDays must be implemented');
  }

  /**
   *
   * @param {string} id
   * @param {} lines
   */
  update({ id, lines }) {
    throw new Error('OrderRepository#update must be implemented');
  }

  /**
   *
   * @param {Order} order
   * @returns {Observable.<Order>}
   */
  save({ order }) {
    throw new Error('OrderRepository#save must be implemented');
  }


}
