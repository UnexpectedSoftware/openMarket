import * as listProductActions from "./action";
import * as Rx from "rxjs";
import OpenMarket from "../../../application/index";

const fetchProductsEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_FETCH)
    .flatMap(action =>
      Rx.Observable.zip(
        OpenMarket.get("products_list_all_use_case").findAllWithLowStock({
          limit: action.payload.limit,
          offset: action.payload.offset
        }),
        OpenMarket.get("products_statistics_use_case").countProductsWithLowStock(),
        (products, total) => ({products:products, total:total, page: action.payload.page})
      ))
     .map(products => listProductActions.listProductFetched(products));

const pageLoadedEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_PAGE_LOADED)
    .map(action => listProductActions.listProductFetch({
      limit: action.payload.limit,
      offset: action.payload.offset,
      page: action.payload.page
    }));


const pageChangedEpic = action$ =>
  action$.ofType(listProductActions.LIST_PRODUCT_PAGE_CHANGED)
    .map(action => listProductActions.listProductFetch({
      page: action.payload.page,
      limit: action.payload.limit,
      offset: action.payload.offset
    }));



export default action$ =>
  Rx.Observable.merge(
    fetchProductsEpic(action$),
    pageLoadedEpic(action$),
    pageChangedEpic(action$)
  ).do(data=>null,error=>console.log(error));
