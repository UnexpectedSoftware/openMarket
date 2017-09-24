import OrderRepository from "../../domain/order/OrderRepository";
import * as Rx from "rxjs";

export default class MysqlOrderRepository extends OrderRepository{

  constructor({connection, orderFactory})  {
    super();
    this._connection = connection;
    this._orderFactory = orderFactory;
  }


  findById({id}) {
    return this._connection.getConnection()
      .flatMap(connection =>
        Rx.Observable.fromPromise(connection.execute('SELECT o.id,o.created_at,o.total,l.id as line_id,l.barcode as line_barcode,l.quantity as line_quantity' +
          ' FROM `order` o, line l WHERE l.id=o.id AND o.id = ?',[id]))
      )
      .flatMap(result => Rx.Observable.from(result))
      .first()
      .flatMap(rows => Rx.Observable.from(rows))
      .map(row  => this._orderFactory.createWith({
        id: row.id,
        lines: row._lines,
        date: order._createdAt
      }));
  }

  findAllByDates({limit, offset, startDate, endDate}) {
    return super.findAllByDates({limit, offset, startDate, endDate});
  }

  countByDates({startDate, endDate}) {
    return super.countByDates({startDate, endDate});
  }

  calculateTotalAmount({startDate, endDate}) {
    return super.calculateTotalAmount({startDate, endDate});
  }

  update({id, lines}) {
    return super.update({id, lines});
  }

  save({order}) {
    return super.save({order});
  }
}
