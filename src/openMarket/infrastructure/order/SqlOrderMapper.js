import * as Rx from "rxjs";
import Order from "../../domain/order/Order";
import Payment from "../../domain/payment/Payment";
import {lineKind} from "../../domain/order/lineValidity";
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
        date: orderData.created_at,
        payment: orderData.payment
      })
    )
  }

  _buildOrderData(data){
    return Rx.Observable.from(data)
      .first()
      .map(firstRow => ({
        id: firstRow.id,
        created_at: firstRow.created_at,
        total: firstRow.total,
        payment: Payment.restore({
          method: firstRow.payment_method,
          tenderedCents: firstRow.tendered_cents,
          changeCents: firstRow.change_cents
        })
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
          : moneyFromColumns(row.line_amount_cents, null),
        kind: lineKind(row.line_kind),
        vatRate: {
          percent: row.line_vat_percent,
          kind: row.line_vat_kind,
          cause: row.line_vat_cause
        }
      }))
      .toArray()
  }
}
