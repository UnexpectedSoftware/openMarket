import * as listOrderActions from "./action";
import OpenMarket from "../../../index";
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
    .map(order => listOrderDetailLoaded(order))
    .flatMap(action => Rx.Observable.of(action,push('/create_order')));



export default action$ =>
  Rx.Observable.merge(
    listOrderFetchWithFilters(action$),
    listOrderDetailEpic(action$)
  );

