import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import OrdersQuery from '../../../domain/order/OrdersQuery';
import {record, userText} from '../../../infrastructure/logging/ErrorLog';
import {
  ORDER_DETAIL_REQUESTED,
  ORDER_REPRINT_CONFIRMED,
  ORDER_REPRINT_REQUESTED,
  ORDERS_RANGE_SELECTED,
  orderDetailFailed,
  orderDetailLoaded,
  orderReprintFailed,
  orderReprintFinished,
  orderReprintPreviewLoaded,
  ordersFailed,
  ordersLoaded,
  ordersSummaryLoaded
} from './action';
/**
 * Latest range wins. A slower earlier query cannot overwrite the list.
 * @param {{find: Function, summary: Function}} orders
 */
export function makeOrdersListEpic(orders) {
  return action$ => action$
    .filter(action => action.type === ORDERS_RANGE_SELECTED)
    .switchMap(action => Rx.Observable.zip(
      orders.find(new OrdersQuery({
        from: action.from,
        to: action.to,
        limit: action.limit,
        offset: action.offset
      })),
      orders.summary({from: action.from, to: action.to}),
      (page, summary) => ({page, summary})
    )
      .mergeMap(({page, summary}) => Rx.Observable.of(
        ordersLoaded({
          items: page.items,
          total: page.total,
          append: action.append === true
        }),
        ordersSummaryLoaded(summary)
      ))
      .catch(error => {
        record(error);
        return Rx.Observable.of(ordersFailed(userText(error, 'No se han podido cargar los pedidos')));
      }));
}

/**
 * Latest id wins. `{id}` reads an OrderDetail, or null when the id is unknown.
 * @param {{find: Function}} orders
 */
export function makeOrderDetailEpic(orders) {
  return action$ => action$
    .filter(action => action.type === ORDER_DETAIL_REQUESTED)
    .switchMap(action => orders.find({id: action.id})
      .map(detail => orderDetailLoaded({id: action.id, detail: detail || null}))
      .catch(error => {
        record(error);
        return Rx.Observable.of(orderDetailFailed({
          id: action.id,
          message: userText(error, 'No se ha podido abrir el pedido')
        }));
      }));
}

/**
 * Builds the ticket HTML for the reprint dialog.
 * @param {{build: Function}} buildReceipt
 */
export function makeOrderReprintEpic(buildReceipt) {
  return action$ => action$
    .filter(action => action.type === ORDER_REPRINT_REQUESTED)
    .switchMap(action => buildReceipt.build({orderId: action.orderId})
      .map(receipt => orderReprintPreviewLoaded({
        orderId: action.orderId,
        html: receipt && receipt.html ? receipt.html : ''
      }))
      .catch(error => {
        record(error);
        return Rx.Observable.of(orderReprintFailed({
          orderId: action.orderId,
          message: userText(error, 'No se ha podido preparar el ticket')
        }));
      }));
}

/**
 * Prints the selected ticket. The preview is a separate build.
 * @param {{build: Function}} buildReceipt
 * @param {{print: Function}} printReceipt
 */
export function makeOrderPrintEpic(buildReceipt, printReceipt) {
  return action$ => action$
    .filter(action => action.type === ORDER_REPRINT_CONFIRMED)
    .switchMap(action => buildReceipt.build({orderId: action.orderId})
      .mergeMap(receipt => printReceipt.print({receipt}))
      .map(() => orderReprintFinished({orderId: action.orderId}))
      .catch(error => {
        record(error);
        return Rx.Observable.of(orderReprintFailed({
          orderId: action.orderId,
          message: userText(error, 'No se ha podido imprimir el ticket')
        }));
      }));
}
