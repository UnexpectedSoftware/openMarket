import OrderRepository from "../../domain/order/OrderRepository";
import * as Rx from "rxjs";
import { add } from "../service/floatCalculatorService";
import { toStoredBound } from "../service/sqliteDates";

const DISPLAY_CREATED_AT = "strftime('%d/%m/%Y %H:%M:%S', created_at)";
const DISPLAY_DAY = "strftime('%d/%m/%Y', created_at)";

export default class SqliteOrderRepository extends OrderRepository {
  constructor({connection, objectMapper}) {
    super();
    this._database = connection.database;
    this._objectMapper = objectMapper;
  }

  findById({id}) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(
        'SELECT o.id, ' + DISPLAY_CREATED_AT + ' as created_at, o.total, ' +
        'l.barcode as line_barcode, l.name as line_name, l.price as line_price, l.quantity as line_quantity ' +
        'FROM "order" o INNER JOIN line l ON l.order_id = o.id WHERE o.id = ?'
      ).all(String(id));
      if (rows.length === 0) {
        return Rx.Observable.empty();
      }
      return this._objectMapper.toDomain({rows});
    });
  }

  findAllByDates({limit, offset, startDate, endDate}) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(
        'SELECT id, ' + DISPLAY_CREATED_AT + ' as createdAt, total FROM "order" ' +
        'WHERE created_at BETWEEN ? AND ? ORDER BY created_at ASC LIMIT ? OFFSET ?'
      ).all(toStoredBound(startDate), toStoredBound(endDate), limit, offset);
      return Rx.Observable.of(rows.map(row => ({
        id: row.id,
        createdAt: row.createdAt,
        total: row.total
      })));
    });
  }

  countByDates({startDate, endDate}) {
    return Rx.Observable.defer(() => {
      const row = this._database.prepare(
        'SELECT count(*) AS total FROM "order" WHERE created_at BETWEEN ? AND ?'
      ).get(toStoredBound(startDate), toStoredBound(endDate));
      return Rx.Observable.of(Number(row.total));
    });
  }

  calculateTotalAmount({startDate, endDate}) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(
        'SELECT total FROM "order" WHERE created_at BETWEEN ? AND ?'
      ).all(toStoredBound(startDate), toStoredBound(endDate));
      const total = rows.reduce((sum, row) => add(sum, row.total), 0);
      return Rx.Observable.of(total);
    });
  }

  calculateTotalAmountByDays({startDate, endDate}) {
    return Rx.Observable.defer(() => {
      const rows = this._database.prepare(
        'SELECT total, ' + DISPLAY_DAY + ' as createdAt FROM "order" ' +
        'WHERE created_at BETWEEN ? AND ? ORDER BY created_at ASC'
      ).all(toStoredBound(startDate), toStoredBound(endDate));
      const grouped = [];
      rows.forEach(row => {
        const last = grouped[grouped.length - 1];
        if (last && last.createdAt === row.createdAt) {
          last.total = add(last.total, row.total);
        } else {
          grouped.push({total: row.total, createdAt: row.createdAt});
        }
      });
      return Rx.Observable.of(grouped);
    });
  }

  update({id, lines}) {
    return super.update({id, lines});
  }

  save({order}) {
    return Rx.Observable.defer(() => {
      this._database.exec('BEGIN');
      try {
        this._database.prepare(
          'INSERT INTO "order" (id, created_at, total) VALUES (?, ?, ?)'
        ).run(String(order.id), toStoredBound(order.createdAt), order.total);
        const insertLine = this._database.prepare(
          'INSERT INTO line (order_id, barcode, name, price, quantity) VALUES (?, ?, ?, ?, ?)'
        );
        order.lines.forEach(line => {
          insertLine.run(String(order.id), line.barcode, line.name, line.price, line.quantity);
        });
        this._database.exec('COMMIT');
        return Rx.Observable.of(order);
      } catch (error) {
        try {
          this._database.exec('ROLLBACK');
        } catch (rollbackError) {
          // A trigger abort can roll the transaction back before we do.
        }
        return Rx.Observable.throw(error);
      }
    });
  }
}
