import * as listProductActions from "./action";
import * as Rx from "rxjs";
import OpenMarket from "../../../index";

const fetchProductsEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_FETCH)
    .flatMap(action =>
      Rx.Observable.zip(
        OpenMarket.get("products_list_all_use_case").findAll({
          limit: action.filters.limit,
          offset: action.filters.offset
        }),
        OpenMarket.get("products_statistics_use_case").countProducts(),
        (products, total) => ({products:products, total:total, page: action.filters.page})
      ))
     .map(products => listProductActions.listProductFetched(products));

const fetchProductsWithFiltersEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_FETCH_WITH_FILTERS)
    .flatMap(action => OpenMarket.get("products_list_all_use_case").findAllByName({
      name: action.filters.name,
      limit: action.filters.limit,
      offset: action.filters.offset
    }))
    .map(products => listProductActions.listProductFetched(products))


export default action$ =>
  Rx.Observable.merge(
    fetchProductsEpic(action$),
    fetchProductsWithFiltersEpic(action$)
  );
