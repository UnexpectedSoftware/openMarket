import * as Rx from "rxjs";
import Order from "../../domain/order/Order";
import {moneyFromColumns, quantityFromColumns} from "../service/storedMoney";

/**
 * A stored order is already placed. Restoring it does not check its lines again.
 */
export default class SqlOrderMapper {
  toDomain({rows}) {
    return Rx.Observable.zip(
      this._buildOrderData(rows),
      this._buildOrderLines(rows),
      (orderData, lines) => Order.restore({
        id: orderData.id,
        lines,
        date: orderData.created_at
      })
    )
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
        price: moneyFromColumns(row.line_price_cents, row.line_price),
        quantity: quantityFromColumns(row.line_quantity_milli, row.line_quantity),
        amount: row.line_amount_cents == null
          ? undefined
          : moneyFromColumns(row.line_amount_cents, null)
      }))
      .toArray()
  }
}
