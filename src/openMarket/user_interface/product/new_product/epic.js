import OpenMarket from "../../../index";
import * as Rx from "rxjs";
import * as newProductActions from "./action";
import {reset, destroy} from 'redux-form';

const saveProductEpic = action$ =>

  action$.ofType(newProductActions.NEW_PRODUCT_SAVE)
    .flatMap(action => OpenMarket.get("products_create_or_update_use_case").createOrUpdate({
      id: action.product.id,
      barcode: action.product.barcode,
      name: action.product.name,
      description: action.product.description,
      price: action.product.price,
      basePrice: action.product.basePrice,
      stock: action.product.stock,
      stockMin: action.product.stockMin,
      weighted: action.product.weighted,
      categoryId: action.product.categoryId,
      status: action.product.status
    })
    )
    .map(saved => newProductActions.newProductSaved());

const savedProductEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_SAVED)
    .map(action => reset('new_product'))
    .mergeMap(resetAction =>
      Rx.Observable.of(
        resetAction,
        newProductActions.newProductFetchCategories(),
        newProductActions.productFetchStatuses()
      )
    );

const fetchCategoriesEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_FETCH_CATEGORIES)
    .flatMap(action => OpenMarket.get("categories_list_all_use_case").findAll())
    .map(categories => newProductActions.newProductFetchedCategories(categories));


const fetchStatusesEpic = action$ =>
  action$.ofType(newProductActions.PRODUCT_FETCH_STATUSES)
    .flatMap(action => OpenMarket.get("products_list_all_use_case").findAllStatuses())
    .map(statuses => newProductActions.productFetchedStatuses(statuses));


const fetchProductEpic = action$ =>
  action$.ofType(newProductActions.EDIT_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_find_use_case").findProductByBarcode({barcode: action.payload}))
    .map(product => newProductActions.editProductFetched({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      price: product.price,
      basePrice: product.basePrice,
      stock: product.stock,
      stockMin: product.stockMin,
      weighted: product.isWeighted,
      categoryId: product.categoryId,
      status: product.status
    }));

const productPageLoadedEpic = action$ =>
  action$.ofType(newProductActions.PRODUCT_PAGE_LOADED)
    .flatMap(action =>
      Rx.Observable.of(
        newProductActions.newProductFetchCategories(),
        newProductActions.productFetchStatuses()
      )
    );

export default action$ =>
  Rx.Observable.merge(
    saveProductEpic(action$),
    savedProductEpic(action$),
    fetchCategoriesEpic(action$),
    fetchStatusesEpic(action$),
    fetchProductEpic(action$),
    productPageLoadedEpic(action$)
  );
