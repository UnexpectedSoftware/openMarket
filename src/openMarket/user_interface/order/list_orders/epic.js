import * as listOrderActions from "./action";
import OpenMarket from "../../../index";
import * as Rx from "rxjs";

const listOrderFetch = action$ =>
  action$.ofType(listOrderActions.LIST_ORDER_FETCH)
    .flatMap(action => OpenMarket.get("orders_list_all_use_case").findAll({limit:10,offset:0}))
    .map(order => listOrderActions.listOrderFetched(order));


export default action$ =>
  Rx.Observable.merge(
    listOrderFetch(action$)
  );

