import * as listProductsActions from "./action";
import * as Rx from "rxjs";
import OpenMarket from "../../../application/index";

const fetchProductsEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_FETCH)
    .flatMap(action =>
      Rx.Observable.zip(
        OpenMarket.get("products_list_all_use_case").findAll({
          limit: action.payload.limit,
          offset: action.payload.offset
        }),
        OpenMarket.get("products_statistics_use_case").countProducts(),
        (products, total) => ({products:products, total:total, page: action.payload.page})
      ))
     .map(products => listProductsActions.listProductsFetched(products));

const pageLoadedEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_PAGE_LOADED)
    .map(action => listProductsActions.listProductsFetch({
      limit: action.payload.limit,
      offset: action.payload.offset,
      page: action.payload.page
    }));


const pageChangedEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_PAGE_CHANGED)
    .map(action => listProductsActions.listProductsFetch({
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
