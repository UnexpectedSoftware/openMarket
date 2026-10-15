import * as Rx from 'rxjs';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';
import {rethrow} from '../logging/ErrorLog';
import {centsOf, eurosOf, milliOf, unitsOf} from '../service/storedMoney';
/** @import { Observable } from 'rxjs/Observable' */
/** @import InvoiceRepository from '../../domain/invoice/InvoiceRepository' */
/** @import Invoice from '../../domain/invoice/Invoice' */
/** @import SqlInvoiceMapper from './SqlInvoiceMapper' */

const INVOICE_COLUMNS = 'i.id, i.series, i.number, i.invoice_number, i.issued_at, i.issue_date, i.type, i.issuer_json, i.corrects_invoice_id, i.order_id, ' +
  'i.status, i.cancelled_at, i.total, i.total_cents';
const LINE_COLUMNS = 'l.barcode, l.name, l.price, l.quantity, l.amount, ' +
  'l.price_cents, l.quantity_milli, l.amount_cents, l.vat_percent, l.vat_kind, l.vat_cause';

const FIND_BY_ID_SQL = 'SELECT ' + INVOICE_COLUMNS + ', ' + LINE_COLUMNS +
  ' FROM invoice i INNER JOIN invoice_line l ON l.invoice_id = i.id' +
  ' WHERE i.id = ? ORDER BY l.position ASC';

const FIND_BY_NUMBER_SQL = 'SELECT ' + INVOICE_COLUMNS + ', ' + LINE_COLUMNS +
  ' FROM invoice i INNER JOIN invoice_line l ON l.invoice_id = i.id' +
  ' WHERE i.invoice_number = ? ORDER BY l.position ASC';

const INSERT_INVOICE_SQL = 'INSERT INTO invoice ' +
  '(id, series, number, invoice_number, issued_at, issue_date, type, issuer_json, order_id, status, cancelled_at, total, total_cents) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

const FIND_BY_ORDER_SQL = 'SELECT ' + INVOICE_COLUMNS + ', ' + LINE_COLUMNS +
  ' FROM invoice i INNER JOIN invoice_line l ON l.invoice_id = i.id' +
  ' WHERE i.order_id = ? ORDER BY l.position ASC';

const INSERT_LINE_SQL = 'INSERT INTO invoice_line ' +
  '(invoice_id, position, barcode, name, price, quantity, amount, price_cents, quantity_milli, amount_cents, vat_percent, vat_kind, vat_cause) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

const INSERT_VAT_SQL = 'INSERT INTO invoice_vat ' +
  '(invoice_id, position, kind, percent, cause, base_cents, quota_cents, gross_cents) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

const FIND_VAT_SQL = 'SELECT kind, percent, cause, base_cents, quota_cents, gross_cents ' +
  'FROM invoice_vat WHERE invoice_id = ? ORDER BY position ASC';

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
   * @param {{orderId: string}} params
   * @returns {Observable<Invoice>}
   */
  findByOrderId({orderId}) {
    return this._find(FIND_BY_ORDER_SQL, String(orderId));
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
      const vatRows = this._database.prepare(FIND_VAT_SQL).all(rows[0].id);
      return Rx.Observable.of(this._mapper.toDomain({rows, vatRows}));
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
      invoice.issueDate,
      invoice.type,
      invoice.issuer ? JSON.stringify(invoice.issuer) : null,
      invoice.orderId,
      invoice.status,
      invoice.cancelledAt,
      eurosOf(invoice.total),
      centsOf(invoice.total)
    );
    const insertLine = this._database.prepare(INSERT_LINE_SQL);
    invoice.lines.forEach((line, position) => {
      insertLine.run(
        invoice.id,
        position,
        line.barcode,
        line.name,
        eurosOf(line.price),
        unitsOf(line.quantity),
        eurosOf(line.amount),
        centsOf(line.price),
        milliOf(line.quantity),
        centsOf(line.amount),
        line.vatRate.percent,
        line.vatRate.kind,
        line.vatRate.cause
      );
    });
    const insertVat = this._database.prepare(INSERT_VAT_SQL);
    invoice.breakdown.forEach((row, position) => {
      insertVat.run(
        invoice.id,
        position,
        row.rate.kind,
        row.rate.percent,
        row.rate.cause,
        row.base.cents,
        row.quota.cents,
        row.gross.cents
      );
    });
  }

}
