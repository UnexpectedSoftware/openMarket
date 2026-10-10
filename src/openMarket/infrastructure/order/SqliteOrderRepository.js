import OrderRepository from "../../domain/order/OrderRepository";
import * as Rx from "rxjs";
import { toStoredBound } from "../service/sqliteDates";

const DISPLAY_CREATED_AT = "strftime('%d/%m/%Y %H:%M:%S', created_at)";
const DISPLAY_DAY = "strftime('%d/%m/%Y', created_at)";

const FIND_BY_ID_SQL = 'SELECT o.id, ' + DISPLAY_CREATED_AT + ' as created_at, o.total, ' +
  'l.barcode as line_barcode, l.name as line_name, l.price as line_price, l.quantity as line_quantity ' +
  'FROM "order" o INNER JOIN line l ON l.order_id = o.id WHERE o.id = ?';

const FIND_ALL_BY_DATES_SQL = 'SELECT id, ' + DISPLAY_CREATED_AT + ' as createdAt, total FROM "order" ' +
  'WHERE created_at BETWEEN ? AND ? ORDER BY created_at ASC LIMIT ? OFFSET ?';

const COUNT_BY_DATES_SQL = 'SELECT count(*) AS total FROM "order" WHERE created_at BETWEEN ? AND ?';

const TOTAL_AMOUNT_SQL = 'SELECT total FROM "order" WHERE created_at BETWEEN ? AND ?';

const TOTAL_AMOUNT_BY_DAYS_SQL = 'SELECT total, ' + DISPLAY_DAY + ' as createdAt FROM "order" ' +
  'WHERE created_at BETWEEN ? AND ? ORDER BY created_at ASC';

const INSERT_ORDER_SQL = 'INSERT INTO "order" (id, created_at, total) VALUES (?, ?, ?)';

const INSERT_LINE_SQL = 'INSERT INTO line (order_id, barcode, name, price, quantity) VALUES (?, ?, ?, ?, ?)';

export default class SqliteOrderRepository extends OrderRepository {
  constructor({connection, objectMapper, queryService}) {
    super();
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
        total: row.total
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

  update({id, lines}) {
    return super.update({id, lines});
  }

  save({order}) {
    return Rx.Observable.defer(() => {
      this._database.prepare(INSERT_ORDER_SQL).run(
        String(order.id),
        toStoredBound(order.createdAt),
        order.total
      );
      const insertLine = this._database.prepare(INSERT_LINE_SQL);
      order.lines.forEach(line => {
        insertLine.run(String(order.id), line.barcode, line.name, line.price, line.quantity);
      });
      return Rx.Observable.of(order);
    });
  }
}
