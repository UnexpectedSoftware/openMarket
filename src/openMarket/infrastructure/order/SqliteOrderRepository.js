import * as Rx from "rxjs";
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
