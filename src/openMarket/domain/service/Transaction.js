/**
 * One boundary around several repository writes. They commit together or roll back together.
 */
export default class Transaction {

  /**
   * @param {function(): Observable} work
   * @returns {Observable}
   */
  run(work) {
    throw new Error('Transaction#run must be implemented');
  }

}
