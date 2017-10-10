import OrderRepository from "../../domain/order/OrderRepository";
import * as Rx from "rxjs";
import moment from "moment";
import Order from "../../domain/order/Order";

export default class MysqlOrderRepository extends OrderRepository{

  constructor({connection, objectMapper})  {
    super();
    this._connection = connection;
    this._objectMapper = objectMapper;
  }

  /**
   *
   * @param {string} id
   * @returns {Observable<Order>}
   */
  findById({id}) {
    return this._connection.execute({
      query: 'SELECT o.id,o.created_at,o.total,l.barcode as line_barcode,l.name as line_name, l.price as line_price, l.quantity as line_quantity'  +
      ' FROM `order` o, line l WHERE l.id=o.id AND o.id = ?',
      params: [id]
    })
      .toArray()
      .flatMap(rows  => this._objectMapper.toDomain({rows}));
  }

  findAllByDates({limit, offset, startDate, endDate}) {
    return this._connection.execute({
      query: 'SELECT o.id,o.created_at as createdAt,o.total FROM `order` o WHERE' +
      ' (o.created_at BETWEEN ? AND ?) LIMIT ? OFFSET ?',
      params: [
        startDate.format('YYYY-MM-DD HH:mm:ss').toString(),
        endDate.format('YYYY-MM-DD HH:mm:ss').toString(),
        limit,
        offset
      ]
    })
      .toArray();

  }

  countByDates({startDate, endDate}) {
    return this._connection.execute({
      query: 'SELECT count(*) as total FROM `order` o WHERE (o.created_at BETWEEN ? AND ?)',
      params: [
        startDate.format('YYYY-MM-DD HH:mm:ss').toString(),
        endDate.format('YYYY-MM-DD HH:mm:ss').toString()
      ]
    })
      .map(row => row.total)
  }

  calculateTotalAmount({startDate, endDate}) {
    return this._connection.execute({
      query: 'SELECT SUM(o.total) as total FROM `order` o WHERE (o.created_at BETWEEN ? AND ?)',
      params: [startDate.format('YYYY-MM-DD HH:mm:ss').toString(), endDate.format('YYYY-MM-DD HH:mm:ss').toString()]
    })
      .map(row => row.total)
  }

  update({id, lines}) {
    return super.update({id, lines});
  }

  /**
   *
   * @param {date} startDate
   * @param {date} endDate
   */
  calculateTotalAmountByDays({startDate, endDate}){
    return this._connection.execute({
      query: 'SELECT SUM(o.total) as total, DATE_FORMAT(o.created_at,\'%d/%m/%Y\') as createdAt, min(o.created_at) FROM `order` o WHERE '+
      '(o.created_at BETWEEN ? AND ?) group by createdAt ORDER BY min(o.created_at) ASC',
      params: [startDate.format('YYYY-MM-DD HH:mm:ss').toString(), endDate.format('YYYY-MM-DD HH:mm:ss').toString()]
    })
      .toArray();
  }



  save({order}) {
    return this._connection.getPool()
      .flatMap(pool =>
        this._insertOrder(pool,order)
          .flatMap(orderId => this._insertLines(pool,orderId,order.lines)
            .map(data => new Order({
              id: orderId,
              lines: order.lines,
              date: order.createdAt
            }))
          )
      );
  }

  _insertOrder(connection,order){
    return Rx.Observable.fromPromise(connection.query(
      'INSERT INTO `order` (created_at,total) ' +
      'VALUES (?,?)',[moment(order.createdAt,'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss').toString(),order.total]
    ))
      .flatMap(resultAndFields => Rx.Observable.from(resultAndFields))
      .first()
      .map(results => results.insertId);
  }

  _insertLines(connection, orderId, lines){
    return Rx.Observable.from(lines)
      .flatMap(line => Rx.Observable.fromPromise(connection.query(
        'INSERT INTO line (id,barcode,name,price,quantity) ' +
        'VALUES (?,?,?,?,?)',[orderId,line.barcode,line.name,line.price,line.quantity]
      )))
      .toArray();
  }


}
