import * as Rx from "rxjs";
import Money from "../../domain/money/Money";
import OrderView from "../../domain/order/OrderView";
import OrderRangeSummary from "../../domain/order/OrderRangeSummary";
import UnexpectedFailure from "../../domain/error/UnexpectedFailure";
import {record} from "../logging/ErrorLog";
import { toStoredBound } from "../service/sqliteDates";
import {centsOf, eurosOf, milliOf, moneyFromColumns, unitsOf} from "../service/storedMoney";
/** @typedef {import("../../domain/order/OrderRepository").default} OrderRepository */

const DISPLAY_CREATED_AT = "strftime('%d/%m/%Y %H:%M:%S', created_at)";
const DISPLAY_DAY = "strftime('%d/%m/%Y', created_at)";

const FIND_BY_ID_SQL = 'SELECT o.id, ' + DISPLAY_CREATED_AT + ' as created_at, o.total, o.total_cents, ' +
  'o.payment_method as payment_method, o.tendered_cents as tendered_cents, o.change_cents as change_cents, ' +
  'l.barcode as line_barcode, l.name as line_name, l.price as line_price, l.quantity as line_quantity, ' +
  'l.price_cents as line_price_cents, l.quantity_milli as line_quantity_milli, l.amount_cents as line_amount_cents, ' +
  'l.vat_percent as line_vat_percent, l.vat_kind as line_vat_kind, l.vat_cause as line_vat_cause, ' +
  'l.kind as line_kind ' +
  'FROM "order" o INNER JOIN line l ON l.order_id = o.id WHERE o.id = ?';

const FIND_ALL_BY_DATES_SQL = 'SELECT id, ' + DISPLAY_CREATED_AT + ' as createdAt, total, total_cents FROM "order" ' +
  'WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC LIMIT ? OFFSET ?';

const COUNT_BY_DATES_SQL = 'SELECT count(*) AS total FROM "order" WHERE created_at BETWEEN ? AND ?';

const FIND_BY_RANGE_SQL =
  'SELECT o.id AS order_id, o.created_at AS created_at, o.total AS total, o.total_cents AS total_cents, ' +
  'o.payment_method AS payment_method, i.invoice_number AS invoice_number, i.status AS invoice_status, ' +
  '(SELECT COUNT(*) FROM line WHERE line.order_id = o.id) AS item_count ' +
  'FROM "order" o LEFT JOIN invoice i ON i.order_id = o.id ' +
  'WHERE o.created_at BETWEEN ? AND ? ' +
  'ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?';

const RANGE_COUNT_SQL = 'SELECT COUNT(*) AS total FROM "order" WHERE created_at BETWEEN ? AND ?';

const RANGE_SUMMARY_SQL = 'SELECT total, total_cents FROM "order" WHERE created_at BETWEEN ? AND ?';

const MISSING_INVOICE = '—';

const TOTAL_AMOUNT_SQL = 'SELECT total, total_cents FROM "order" WHERE created_at BETWEEN ? AND ?';

const TOTAL_AMOUNT_BY_DAYS_SQL = 'SELECT total, total_cents, ' + DISPLAY_DAY + ' as createdAt FROM "order" ' +
  'WHERE created_at BETWEEN ? AND ? ORDER BY created_at ASC';

const INSERT_ORDER_SQL = 'INSERT INTO "order" ' +
  '(id, created_at, total, total_cents, payment_method, tendered_cents, change_cents) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?)';

const INSERT_LINE_SQL = 'INSERT INTO line ' +
  '(order_id, barcode, name, price, quantity, price_cents, quantity_milli, amount_cents, vat_percent, vat_kind, vat_cause, kind) ' +
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

/** @implements {OrderRepository} */
export default class SqliteOrderRepository {
  constructor({connection, objectMapper, queryService}) {
    this._database = connection.database;
    this._objectMapper = objectMapper;
    this._queryService = queryService;
  }

  findById({id}) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(FIND_BY_ID_SQL).all(String(id));
      if (rows.length === 0) {
        return Rx.Observable.empty();
      }
      return this._objectMapper.toDomain({rows});
    });
  }

  findAllByDates({limit, offset, startDate, endDate}) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(FIND_ALL_BY_DATES_SQL).all(
        toStoredBound(startDate),
        toStoredBound(endDate),
        limit,
        offset
      );
      return Rx.Observable.of(rows.map(row => ({
        id: row.id,
        createdAt: row.createdAt,
        total: moneyFromColumns(row.total_cents, row.total).toEuros()
      })));
    });
  }

  findByRange({from, to, limit, offset}) {
    return Rx.Observable.defer(() => Rx.Observable.of(
      readOrderPage(this._database, {from, to, limit, offset})
    ));
  }

  summary({from, to}) {
    return Rx.Observable.defer(() => Rx.Observable.of(
      readOrderSummary(this._database, {from, to})
    ));
  }

  countByDates({startDate, endDate}) {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare(COUNT_BY_DATES_SQL).get(
        toStoredBound(startDate),
        toStoredBound(endDate)
      );
      return Rx.Observable.of(Number(row.total));
    });
  }

  calculateTotalAmount({startDate, endDate}) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(TOTAL_AMOUNT_SQL).all(
        toStoredBound(startDate),
        toStoredBound(endDate)
      );
      return Rx.Observable.of(this._queryService.totalAmount(rows));
    });
  }

  calculateTotalAmountByDays({startDate, endDate}) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(TOTAL_AMOUNT_BY_DAYS_SQL).all(
        toStoredBound(startDate),
        toStoredBound(endDate)
      );
      return Rx.Observable.of(this._queryService.totalsByDay(rows));
    });
  }

  save({order}) {
    return Rx.Observable.defer(() => {
      const payment = order.payment || null;
      this._database.prepare(INSERT_ORDER_SQL).run(
        String(order.id),
        toStoredBound(order.createdAt),
        eurosOf(order.total),
        centsOf(order.total),
        payment ? payment.method : null,
        payment ? payment.tenderedCents : null,
        payment ? payment.changeCents : null
      );
      const insertLine = this._database.prepare(INSERT_LINE_SQL);
      order.lines.forEach(line => {
        insertLine.run(
          String(order.id),
          line.barcode,
          line.name,
          eurosOf(line.price),
          unitsOf(line.quantity),
          centsOf(line.price),
          milliOf(line.quantity),
          centsOf(line.amount),
          line.vatRate.percent,
          line.vatRate.kind,
          line.vatRate.cause,
          line.kind === 'FREE' ? 'FREE' : 'PRODUCT'
        );
      });
      return Rx.Observable.of(order);
    });
  }
}

/**
 * The page and the range count are two statements: an empty page must still
 * report how many orders the range contains.
 * @param {*} database
 * @param {{from: string, to: string, limit?: number, offset?: number}} query
 * @returns {{items: OrderView[], total: number}}
 */
function readOrderPage(database, {from, to, limit, offset}) {
  const bounds = storedBounds(from, to);
  const rows = database.prepare(FIND_BY_RANGE_SQL).all(
    bounds.from,
    bounds.to,
    normalizeLimit(limit),
    normalizeOffset(offset)
  );
  const total = countOf(database.prepare(RANGE_COUNT_SQL).get(bounds.from, bounds.to));
  return {items: rows.map(toView), total};
}

/**
 * @param {*} database
 * @param {{from: string, to: string}} query
 * @returns {OrderRangeSummary}
 */
function readOrderSummary(database, {from, to}) {
  const bounds = storedBounds(from, to);
  const rows = database.prepare(RANGE_SUMMARY_SQL).all(bounds.from, bounds.to);
  const total = rows.reduce(
    (sum, row) => sum.plus(moneyFromColumns(row.total_cents, row.total)),
    Money.ofCents(0)
  );
  return new OrderRangeSummary({totalCents: total.cents, ticketCount: rows.length});
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
 * @returns {OrderView}
 */
function toView(row) {
  return new OrderView({
    orderId: row.order_id == null ? '' : String(row.order_id),
    invoiceNumber: invoiceNumber(row),
    createdAt: isoLocal(row.created_at),
    itemCount: Number(row.item_count) || 0,
    paymentMethod: paymentMethod(row.payment_method),
    totalCents: moneyFromColumns(row.total_cents, row.total).cents,
    cancelled: row.invoice_status === 'CANCELLED'
  });
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
      context: {orderId: row.order_id == null ? undefined : String(row.order_id), operation: 'findByRange'}
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
