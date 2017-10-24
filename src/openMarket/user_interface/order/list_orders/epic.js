import * as listOrderActions from "./action";
import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import {push} from 'react-router-redux';
import {listOrderDetailLoaded} from "./action";

const listOrderFetchWithFilters = action$ =>
  action$.ofType(listOrderActions.LIST_ORDER_FETCH_WITH_FILTERS)
    .flatMap(action => Rx.Observable.zip(
      OpenMarket.get("orders_list_all_use_case")
      .findAllByDates({
          limit:action.filters.limit,
          offset:action.filters.offset,
          startDate: action.filters.startDate,
          endDate: action.filters.endDate
        }),
      OpenMarket.get("orders_statistics_use_case")
        .countByDates({
          startDate: action.filters.startDate,
          endDate: action.filters.endDate
        }),
      OpenMarket.get("orders_statistics_use_case")
        .calculateTotalAmount({
          startDate: action.filters.startDate,
          endDate: action.filters.endDate
        }),
      (orders, total, amount) => ({ orders: orders, total:total, amount: amount, page:action.filters.page })
    ))
    .map(data => listOrderActions.listOrderFetched(data));


const listOrderDetailEpic = action$ =>
  action$.ofType(listOrderActions.LIST_ORDER_DETAIL)
    .flatMap(action => OpenMarket.get("orders_list_all_use_case").findById({id: action.payload}))
    .flatMap(order =>
      Rx.Observable.of(
        listOrderDetailLoaded(order),
        push({
          pathname: '/create_order',
          search: `?id=${order.id}`,
          state: { orderId: order.id }
        })
      )
    );




export default action$ =>
  Rx.Observable.merge(
    listOrderFetchWithFilters(action$),
    listOrderDetailEpic(action$)
  ).do(() => null,error => console.log(error),()=> null)


