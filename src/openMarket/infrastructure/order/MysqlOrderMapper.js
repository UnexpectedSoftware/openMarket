import ObjectMapper from "../service/ObjectMapper";
import * as Rx from "rxjs";

export default class MysqlOrderMapper extends ObjectMapper {
  constructor({orderFactory}){
    super();
    this._orderFactory = orderFactory;
  }
  toDomain({rows}) {
    return Rx.Observable.zip(
      this._buildOrderData(rows),
      this._buildOrderLines(rows),
      (orderData, lines) => this._orderFactory.createWith({
        id: orderData.id,
        lines,
        date: orderData.created_at
      })
    )
  }

  toPersistence({domain}) {
    return super.toPersistence({domain});
  }

  _buildOrderData(data){
    return Rx.Observable.from(data)
      .first()
      .map(firstRow => ({
        id: firstRow.id,
        created_at: firstRow.created_at,
        total: firstRow.total
      }))
  }

  _buildOrderLines(data){
    return Rx.Observable.from(data)
      .map(row => ({
        barcode: row.line_barcode,
        name: row.line_name,
        price: row.line_price,
        quantity: row.line_quantity
      }))
      .toArray()
  }
}
