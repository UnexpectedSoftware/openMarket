/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */

/**
 * One boundary around several repository writes. They commit together or roll back together.
 * Adapters declare `@implements {Transaction}`; they do not extend this class.
 * @interface
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
   * @param {() => *} work
   * @returns {*}
   */
  execute(work) {
    throw new Error('Transaction#execute must be implemented');
  }

  /**
   * @param {() => Observable<any>} work
   * @returns {Observable<any>}
   */
  run(work) {
    throw new Error('Transaction#run must be implemented');
  }

}
