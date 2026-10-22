import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/zip';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import OrdersQuery from '../../../domain/order/OrdersQuery';
import {record, userText} from '../../../infrastructure/logging/ErrorLog';
import {
  ORDERS_RANGE_SELECTED,
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
