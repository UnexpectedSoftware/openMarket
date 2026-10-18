import * as Rx from 'rxjs';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
/** @typedef {import('../../domain/service/Transaction').default} Transaction */
/** @typedef {import('./SqliteConnection').default} SqliteConnection */
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */

/**
 * Commits only after the work observable completes, then emits its values.
 * The bus is not involved. Callers raise events on the observable that comes out.
 * @implements {Transaction}
 */
export default class SqliteTransaction {

  /**
   * @param {object} deps
   * @param {SqliteConnection} deps.connection
   */
  constructor({connection}) {
    this._database = connection.database;
  }

  /**
   * @returns {boolean}
   */
  inTransaction() {
    return this._database.isTransaction;
  }

  /**
   * @param {() => *} work
   * @returns {*}
   */
  execute(work) {
    if (this.inTransaction()) {
      return work();
    }
    this._database.exec('BEGIN');
    try {
      const result = work();
      this._database.exec('COMMIT');
      return result;
    } catch (error) {
      try {
        this._database.exec('ROLLBACK');
      } catch (rollbackError) {
        // A failed statement can already have ended the transaction.
      }
      throw error;
    }
  }

  /**
   * @param {() => Observable<any>} work
   * @returns {Observable<any>}
   */
  run(work) {
    return Rx.Observable.defer(() => {
      let committed = false;
      try {
        this._database.exec('BEGIN');
        return work()
          .toArray()
          .flatMap(values => {
            this._database.exec('COMMIT');
            committed = true;
            return Rx.Observable.from(values);
          })
          .catch(error => {
            this._rollback(committed);
            return Rx.Observable.throw(error);
          });
      } catch (error) {
        this._rollback(committed);
        return Rx.Observable.throw(error);
      }
    });
  }

  _rollback(committed) {
    if (committed) {
      return;
    }
    try {
      this._database.exec('ROLLBACK');
    } catch (rollbackError) {
      // A trigger abort can roll the transaction back before we do.
    }
  }

}
