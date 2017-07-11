import * as listOrderActions from "./action";
import OpenMarket from "../../../index";
import * as Rx from "rxjs";

const listOrderFetchWithFilters = action$ =>
  action$.ofType(listOrderActions.LIST_ORDER_FETCH_WITH_FILTERS)
    .flatMap(action => OpenMarket.get("orders_list_all_use_case").findAll({limit:action.filters.limit,offset:action.filters.offset}))
    .map(order => listOrderActions.listOrderFetched(order));

export default action$ =>
  Rx.Observable.merge(
    listOrderFetchWithFilters(action$)
  );

