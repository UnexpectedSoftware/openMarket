import * as Rx from 'rxjs';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/of';
import InvoiceNumber from '../../domain/invoice/InvoiceNumber';
import {rethrow} from '../logging/ErrorLog';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../domain/invoice/InvoiceSequence').default} InvoiceSequence */

const NEXT_SQL = 'INSERT INTO invoice_sequence (series, last_number) VALUES (?, 1) ' +
  'ON CONFLICT(series) DO UPDATE SET last_number = last_number + 1 ' +
  'RETURNING last_number';

/**
 * Next number for one series.
 * The insert joins the transaction already open on this connection,
 * so a rollback gives the number back.
 * @implements {InvoiceSequence}
 */
export default class SqliteInvoiceSequence {

  /**
   * @param {{connection: {database: any}}} deps
   */
  constructor({connection}) {
    this._database = connection.database;
    this._next = this._database.prepare(NEXT_SQL);
  }

  /**
   * @param {{series: string}} params
   * @returns {Observable<InvoiceNumber>}
   */
  next({series}) {
    return Rx.Observable.defer(() => {
      const key = series == null ? '' : String(series).trim();
      try {
        const row = this._next.get(key);
        if (!row || row.last_number == null) {
          rethrow(new Error('Invoice sequence did not return a number'), {
            message: 'Could not allocate an invoice number',
            context: {series: key, operation: 'next'}
          });
        }
        return Rx.Observable.of(new InvoiceNumber({series: key, number: Number(row.last_number)}));
      } catch (error) {
        rethrow(error, {
          message: 'Could not allocate an invoice number',
          context: {series: key, operation: 'next'}
        });
      }
    });
  }

}
