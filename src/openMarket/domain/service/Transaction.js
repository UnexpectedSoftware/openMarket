/**
 * One boundary around several repository writes. They commit together or roll back together.
 */
export default class Transaction {

  /**
   * @returns {boolean}
   */
  inTransaction() {
    throw new Error('Transaction#inTransaction must be implemented');
  }

  /**
   * Runs work inside the transaction that is already open.
   * Opens one, then commits or rolls it back, when none is open.
   * @param {function(): *} work
   * @returns {*}
   */
  execute(work) {
    throw new Error('Transaction#execute must be implemented');
  }

  /**
   * @param {function(): Observable} work
   * @returns {Observable}
   */
  run(work) {
    throw new Error('Transaction#run must be implemented');
  }

}
