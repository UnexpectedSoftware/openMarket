import * as Rx from 'rxjs';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import Transaction from '../../domain/service/Transaction';

/**
 * Commits only after the work observable completes, then emits its values.
 * The bus is not involved. Callers raise events on the observable that comes out.
 */
export default class SqliteTransaction extends Transaction {

  /**
   * @param {SqliteConnection} connection
   */
  constructor({connection}) {
    super();
    this._database = connection.database;
  }

  /**
   * @returns {boolean}
   */
  inTransaction() {
    return this._database.isTransaction;
  }

  /**
   * @param {function(): *} work
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
   * @param {function(): Observable} work
   * @returns {Observable}
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
