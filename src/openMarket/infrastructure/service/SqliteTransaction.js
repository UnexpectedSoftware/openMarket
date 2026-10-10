import * as Rx from 'rxjs';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';

/**
 * Commits only after the work observable completes, then emits its values.
 * Synchronous domain-event handlers run during the work, so a throw rolls it back.
 * Live listeners are released after COMMIT, with the transaction closed.
 */
export default class SqliteTransaction {

  /**
   * @param {SqliteConnection} connection
   * @param {DomainEventBus} [domainEventBus]
   */
  constructor({connection, domainEventBus = null}) {
    this._database = connection.database;
    this._domainEventBus = domainEventBus;
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
            if (this._domainEventBus) {
              this._domainEventBus.transactionCommitted();
            }
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
    if (this._domainEventBus) {
      this._domainEventBus.transactionRolledBack();
    }
  }

}
