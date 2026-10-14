import * as Rx from 'rxjs';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import {rethrow} from '../logging/ErrorLog';
/** @import { Observable } from 'rxjs/Observable' */
/** @import InvoiceRepository from '../../domain/invoice/InvoiceRepository' */
/** @import Invoice from '../../domain/invoice/Invoice' */
/** @import SqlInvoiceMapper from './SqlInvoiceMapper' */

const INVOICE_COLUMNS = 'i.id, i.series, i.number, i.invoice_number, i.issued_at, i.order_id, ' +
  'i.status, i.cancelled_at, i.total';
const LINE_COLUMNS = 'l.barcode, l.name, l.price, l.quantity';

const FIND_BY_ID_SQL = 'SELECT ' + INVOICE_COLUMNS + ', ' + LINE_COLUMNS +
  ' FROM invoice i INNER JOIN invoice_line l ON l.invoice_id = i.id' +
  ' WHERE i.id = ? ORDER BY l.position ASC';

const FIND_BY_NUMBER_SQL = 'SELECT ' + INVOICE_COLUMNS + ', ' + LINE_COLUMNS +
  ' FROM invoice i INNER JOIN invoice_line l ON l.invoice_id = i.id' +
  ' WHERE i.invoice_number = ? ORDER BY l.position ASC';

const INSERT_INVOICE_SQL = 'INSERT INTO invoice ' +
  '(id, series, number, invoice_number, issued_at, order_id, status, cancelled_at, total) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

const INSERT_LINE_SQL = 'INSERT INTO invoice_line ' +
  '(invoice_id, position, barcode, name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)';

const UPDATE_CANCELLATION_SQL = 'UPDATE invoice SET status = ?, cancelled_at = ? WHERE id = ?';

const EXISTS_SQL = 'SELECT id FROM invoice WHERE id = ?';

/**
 * Stores invoices. A later save may record a cancellation.
 * The number, the lines, the issue time, and the total stay as first written.
 * @implements {InvoiceRepository}
 */
export default class SqliteInvoiceRepository {

  /**
   * @param {{connection: {database: any}, invoiceMapper: SqlInvoiceMapper}} deps
   */
  constructor({connection, invoiceMapper}) {
    this._database = connection.database;
    this._mapper = invoiceMapper;
  }

  /**
   * @param {{invoice: Invoice}} params
   * @returns {Observable<Invoice>}
   */
  save({invoice}) {
    return Rx.Observable.defer(() => {
      try {
        const existing = this._database.prepare(EXISTS_SQL).get(invoice.id);
        if (existing) {
          this._database.prepare(UPDATE_CANCELLATION_SQL).run(
            invoice.status,
            invoice.cancelledAt,
            invoice.id
          );
        } else {
          this._insert(invoice);
        }
        return Rx.Observable.of(invoice);
      } catch (error) {
        rethrow(error, {
          message: 'Could not save the invoice',
          context: {id: invoice.id, invoiceNumber: invoice.invoiceNumber.formatted, operation: 'save'}
        });
      }
    });
  }

  /**
   * @param {{id: string}} params
   * @returns {Observable<Invoice>}
   */
  findById({id}) {
    return this._find(FIND_BY_ID_SQL, String(id));
  }

  /**
   * @param {{invoiceNumber: string}} params
   * @returns {Observable<Invoice>}
   */
  findByNumber({invoiceNumber}) {
    return this._find(FIND_BY_NUMBER_SQL, String(invoiceNumber));
  }

  /**
   * @param {string} sql
   * @param {string} key
   * @returns {Observable<Invoice>}
   */
  _find(sql, key) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(sql).all(key);
      if (rows.length === 0) {
        return Rx.Observable.empty();
      }
      return Rx.Observable.of(this._mapper.toDomain({rows}));
    });
  }

  /**
   * @param {Invoice} invoice
   */
  _insert(invoice) {
    this._database.prepare(INSERT_INVOICE_SQL).run(
      invoice.id,
      invoice.invoiceNumber.series,
      invoice.invoiceNumber.number,
      invoice.invoiceNumber.formatted,
      invoice.issuedAt,
      invoice.orderId,
      invoice.status,
      invoice.cancelledAt,
      invoice.total
    );
    const insertLine = this._database.prepare(INSERT_LINE_SQL);
    invoice.lines.forEach((line, position) => {
      insertLine.run(invoice.id, position, line.barcode, line.name, line.price, line.quantity);
    });
  }

}
