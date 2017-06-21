import * as listProductActions from "./action";
import * as Rx from "rxjs";
import OpenMarket from "../../../index";

const fetchProductsEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_list_all_use_case").findAll({limit:100,offset:0}))
    .map(products => listProductActions.listProductFetched(products));

const fetchProductsWithFiltersEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_FETCH_WITH_FILTERS)
    .flatMap(action => OpenMarket.get("products_list_all_use_case").findAllByName({
      name: action.filters,
      limit:100,
      offset:0
    }))
    .map(products => listProductActions.listProductFetched(products))


export default action$ =>
  Rx.Observable.merge(
    fetchProductsEpic(action$),
    fetchProductsWithFiltersEpic(action$)
  );
