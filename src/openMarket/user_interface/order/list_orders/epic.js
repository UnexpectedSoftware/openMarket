import * as listOrderActions from "./action";
import OpenMarket from "../../../index";
import * as Rx from "rxjs";

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
      (orders, total, amount) => ({ orders: orders, total:total, amount: amount })
    ))
    .map(data => listOrderActions.listOrderFetched(data));

export default action$ =>
  Rx.Observable.merge(
    listOrderFetchWithFilters(action$)
  );

