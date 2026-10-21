import * as Rx from 'rxjs';
import {push} from 'react-router-redux';
import OpenMarket from '../../../application/index';
import {record} from '../../../infrastructure/logging/ErrorLog';
import {LIST_ORDER_DETAIL, listOrderDetailLoaded} from './action';
import {makeOrdersListEpic} from './epicFactory';

const ordersListEpic = makeOrdersListEpic(OpenMarket.get('orders_list_query'));

const listOrderDetailEpic = action$ =>
  action$.ofType(LIST_ORDER_DETAIL)
    .flatMap(action => OpenMarket.get('orders_list_all_use_case').findById({id: action.payload}))
    .flatMap(order =>
      Rx.Observable.of(
        listOrderDetailLoaded(order),
        push({
          pathname: '/create_order',
          search: `?id=${order.id}`,
          state: {orderId: order.id}
        })
      )
    );

export default action$ =>
  Rx.Observable.merge(
    ordersListEpic(action$),
    listOrderDetailEpic(action$)
  ).do(() => null, error => record(error), () => null);
