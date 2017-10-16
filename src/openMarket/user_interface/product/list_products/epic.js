import * as listProductsActions from "./action";
import * as Rx from "rxjs";
import {push} from 'react-router-redux';
import OpenMarket from "../../../application/index";
import {defaultLimit, defaultOffset} from "../../order/list_orders/model";

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


const listProductsFilterChangedEpic = action$ =>
  action$.debounceTime(300)
    .ofType(listProductsActions.LIST_PRODUCTS_FILTER_CHANGED)
    .flatMap(action => Rx.Observable.from(action.payload)
      .map(filter => {
        return (filter.id === 'barcode')?
          listProductsActions.listProductsBarcodeFilterChanged(filter.value) :
          listProductsActions.listProductsNameFilterChanged(filter.value)
      })
      .defaultIfEmpty(listProductsActions.listProductsFilterReseted())
    );

const listProductsFilterResetedEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_FILTER_RESETED)
    .map(action => listProductsActions.listProductsFetch({
      limit: defaultLimit,
      offset: defaultOffset,
      page: 0
    }));

const listProductsBarcodeFilterChangedEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_BARCODE_FILTER_CHANGED)
    .flatMap(action =>
      OpenMarket.get("products_find_use_case").findProductByBarcode({
        barcode: action.payload
      })
        .toArray()
    )
    .map(products => ({products:products, total:1, page: 0}))
    .map(products => listProductsActions.listProductsFetched(products));

const listProductsNameFilterChangedEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_NAME_FILTER_CHANGED)
    .flatMap(action =>
      Rx.Observable.zip(
        OpenMarket.get("products_list_all_use_case").findAllByName({
          name: action.payload,
          limit: 100,
          offset: defaultOffset
        }),
        OpenMarket.get("products_statistics_use_case").countProductsByName({name: action.payload}),
        (products, total) => ({products:products, total:total, page: action.payload.page})
      ))
    .map(products => listProductsActions.listProductsFetched(products));


export default action$ =>
  Rx.Observable.merge(
    fetchProductsEpic(action$),
    pageLoadedEpic(action$),
    pageChangedEpic(action$),
    listProductsDetailEpic(action$),
    listProductsFilterChangedEpic(action$),
    listProductsBarcodeFilterChangedEpic(action$),
    listProductsNameFilterChangedEpic(action$),
    listProductsFilterResetedEpic(action$)
  ).do(data=>null,error=>console.log(error));
