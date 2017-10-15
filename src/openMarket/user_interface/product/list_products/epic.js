import * as listProductsActions from "./action";
import * as Rx from "rxjs";
import {push} from 'react-router-redux';
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

const listProductsDetailEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_DETAIL)
    .flatMap(action => OpenMarket.get("products_find_use_case").findProductByBarcode({
      barcode: action.payload
    }))
    .map(product => ({
      barcode:  product.barcode,
      basePrice: product.basePrice,
      description: product.description,
      name: product.name,
      price: product.price,
      status: product.status,
      stock: product.stock,
      stockMin: product.stockMin,
      weighted: product.isWeighted,
      categoryId: product.category.id
    }))
    .flatMap(product =>
      Rx.Observable.of(
        listProductsActions.listProductsDetailLoaded(product),
        push({
          pathname: '/create_product',
          search: '?edition=true'
        })
      )
    );


export default action$ =>
  Rx.Observable.merge(
    fetchProductsEpic(action$),
    pageLoadedEpic(action$),
    pageChangedEpic(action$),
    listProductsDetailEpic(action$)
  ).do(data=>null,error=>console.log(error));
