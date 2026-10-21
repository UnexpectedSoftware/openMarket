import * as Rx from 'rxjs';
import Money from '../../domain/money/Money';
import UnexpectedFailure from '../../domain/error/UnexpectedFailure';
import {record, rethrow} from '../logging/ErrorLog';
import {toStoredBound} from '../service/sqliteDates';
import {moneyFromColumns} from '../service/storedMoney';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../domain/order/OrdersQuery').default} OrdersQuery */
/** @typedef {import('../../domain/order/OrdersQuery').OrderListItem} OrderListItem */
/** @typedef {import('../../domain/order/OrdersQuery').OrderSummary} OrderSummary */

const LIST_SQL =
  'SELECT o.id AS order_id, o.created_at AS created_at, o.total AS total, o.total_cents AS total_cents, ' +
  'o.payment_method AS payment_method, i.invoice_number AS invoice_number, i.status AS invoice_status, ' +
  '(SELECT COUNT(*) FROM line WHERE line.order_id = o.id) AS item_count ' +
  'FROM "order" o LEFT JOIN invoice i ON i.order_id = o.id ' +
  'WHERE o.created_at BETWEEN ? AND ? ' +
  'ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?';

const COUNT_SQL = 'SELECT COUNT(*) AS total FROM "order" WHERE created_at BETWEEN ? AND ?';

const SUMMARY_SQL = 'SELECT total, total_cents FROM "order" WHERE created_at BETWEEN ? AND ?';

const MISSING_INVOICE = '—';

/**
 * Orders list and day summary. Rows stay plain objects.
 * The page and the range count are two statements: an empty page must still
 * report how many orders the range contains.
 * @implements {OrdersQuery}
 */
export default class SqliteOrdersQuery {

  /** @param {{connection: {database: any}}} deps */
  constructor({connection}) {
    this._database = connection.database;
  }

  /**
   * @param {{from: string, to: string, limit?: number, offset?: number}} query
   * @returns {Observable<{items: OrderListItem[], total: number}>}
   */
  list({from, to, limit, offset}) {
    return Rx.Observable.defer(() => {
      try {
        return Rx.Observable.of(readPage(this._database, {from, to, limit, offset}));
      } catch (error) {
        rethrow(error, {message: 'Could not list orders', context: {operation: 'list'}});
        return Rx.Observable.throw(error);
      }
    });
  }

  /**
   * @param {{from: string, to: string}} query
   * @returns {Observable<OrderSummary>}
   */
  daySummary({from, to}) {
    return Rx.Observable.defer(() => {
      try {
        return Rx.Observable.of(readSummary(this._database, {from, to}));
      } catch (error) {
        rethrow(error, {message: 'Could not summarize orders', context: {operation: 'daySummary'}});
        return Rx.Observable.throw(error);
      }
    });
  }

}

/**
 * @param {*} database
 * @param {{from: string, to: string, limit?: number, offset?: number}} query
 * @returns {{items: OrderListItem[], total: number}}
 */
function readPage(database, {from, to, limit, offset}) {
  const bounds = storedBounds(from, to);
  const rows = database.prepare(LIST_SQL).all(
    bounds.from,
    bounds.to,
    normalizeLimit(limit),
    normalizeOffset(offset)
  );
  const total = countOf(database.prepare(COUNT_SQL).get(bounds.from, bounds.to));
  return {items: rows.map(toItem), total};
}

/**
 * @param {*} database
 * @param {{from: string, to: string}} query
 * @returns {OrderSummary}
 */
function readSummary(database, {from, to}) {
  const bounds = storedBounds(from, to);
  return summarize(database.prepare(SUMMARY_SQL).all(bounds.from, bounds.to));
}

/**
 * @param {string} from
 * @param {string} to
 * @returns {{from: string, to: string}}
 */
function storedBounds(from, to) {
  return {from: toStoredBound(from), to: toStoredBound(to)};
}

/**
 * @param {number | undefined} limit
 * @returns {number}
 */
function normalizeLimit(limit) {
  const value = Number(limit);
  if (!Number.isInteger(value) || value <= 0) {
    return 20;
  }
  return value > 100 ? 100 : value;
}

/**
 * @param {number | undefined} offset
 * @returns {number}
 */
function normalizeOffset(offset) {
  const value = Number(offset);
  if (!Number.isInteger(value) || value < 0) {
    return 0;
  }
  return value;
}

/**
 * @param {{total?: number} | undefined} row
 * @returns {number}
 */
function countOf(row) {
  if (!row || row.total == null) {
    return 0;
  }
  return Number(row.total);
}

/**
 * @param {{order_id?: string, created_at?: string, total?: number | null, total_cents?: number | null, payment_method?: string | null, invoice_number?: string | null, invoice_status?: string | null, item_count?: number | null}} row
 * @returns {OrderListItem}
 */
function toItem(row) {
  return {
    orderId: row.order_id == null ? '' : String(row.order_id),
    invoiceNumber: invoiceNumber(row),
    createdAt: isoLocal(row.created_at),
    itemCount: Number(row.item_count) || 0,
    paymentMethod: paymentMethod(row.payment_method),
    totalCents: moneyFromColumns(row.total_cents, row.total).cents,
    cancelled: row.invoice_status === 'CANCELLED'
  };
}

/**
 * An order without an invoice is a data error. The row stays on the list as "—".
 * @param {{order_id?: string, invoice_number?: string | null}} row
 * @returns {string}
 */
function invoiceNumber(row) {
  if (row.invoice_number == null || row.invoice_number === '') {
    record(new UnexpectedFailure({
      message: 'Order ' + (row.order_id == null ? '' : String(row.order_id)) + ' has no invoice',
      userMessage: 'Pedido sin factura',
      context: {orderId: row.order_id == null ? undefined : String(row.order_id), operation: 'list'}
    }));
    return MISSING_INVOICE;
  }
  return String(row.invoice_number);
}

/**
 * @param {string | null | undefined} method
 * @returns {'cash'|'card'|null}
 */
function paymentMethod(method) {
  if (method === 'cash' || method === 'card') {
    return method;
  }
  return null;
}

/**
 * @param {string | null | undefined} stored
 * @returns {string}
 */
function isoLocal(stored) {
  return String(stored == null ? '' : stored).replace(' ', 'T');
}

/**
 * @param {Array<{total?: number | null, total_cents?: number | null}>} rows
 * @returns {OrderSummary}
 */
function summarize(rows) {
  const total = rows.reduce(
    (sum, row) => sum.plus(moneyFromColumns(row.total_cents, row.total)),
    Money.ofCents(0)
  );
  const ticketCount = rows.length;
  return {
    totalCents: total.cents,
    ticketCount,
    averageCents: ticketCount === 0 ? 0 : Math.round(total.cents / ticketCount)
  };
}
