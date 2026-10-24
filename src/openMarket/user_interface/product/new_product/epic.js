import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import OpenMarket from "../../../application/index";
import * as Rx from "rxjs";
import { LOCATION_CHANGE } from 'react-router-redux';
import {toast} from '../../components/toast';
import * as newProductActions from "./action";
import {reset} from 'redux-form';
import {record, userText} from "../../../infrastructure/logging/ErrorLog";

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
      vatRate: action.product.vatRate,
      categoryId: action.product.categoryId,
      status: action.product.status,
      imagePath: action.product.imagePath
    })
      .map(() => newProductActions.newProductSaved({ edition: action.product.edition }))
      .catch(saveError => {
        record(saveError);
        return Rx.Observable.of(toast.error(
          'Product was not saved',
          userText(saveError, 'Product was not saved')
        ));
      }));

const savedToast = edition => edition
  ? toast.success('Changes applied', 'Your changes were applied')
  : toast.success('Product saved!', 'Product saved in database');

const savedProductEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_SAVED)
    .mergeMap(action => {
      const notice = savedToast(action.edition);
      if (action.edition) {
        return Rx.Observable.of(notice);
      }
      return Rx.Observable.of(
        reset('new_product'),
        newProductActions.newProductFetchCategories(),
        newProductActions.productFetchStatuses(),
        notice
      );
    });

const fetchCategoriesEpic = action$ =>
  action$.ofType(newProductActions.NEW_PRODUCT_FETCH_CATEGORIES)
    .flatMap(() => OpenMarket.get("categories_list_all_use_case").findAllWithStats())
    .map(categories => newProductActions.newProductFetchedCategories(
      (categories || [])
        .map(category => ({
          id: category.id,
          name: category.name,
          imageSrc: null
        }))
        .sort((left, right) => left.name.localeCompare(right.name))
    ));

const fetchStatusesEpic = action$ =>
  action$.ofType(newProductActions.PRODUCT_FETCH_STATUSES)
    .flatMap(() => OpenMarket.get("products_list_all_use_case").findAllStatuses())
    .map(statuses => newProductActions.productFetchedStatuses(statuses));

const fetchProductEpic = action$ =>
  action$.ofType(newProductActions.EDIT_PRODUCT_FETCH)
    .flatMap(action => OpenMarket.get("products_find_use_case").findProductByBarcode({barcode: action.payload}))
    .map(product => newProductActions.editProductFetched({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      price: product.price.toEuros(),
      basePrice: product.basePrice.toEuros(),
      vatRate: product.vatRate.code(),
      stock: product.stock,
      stockMin: product.stockMin,
      weighted: product.isWeighted,
      categoryId: product.category.id,
      status: product.status
    }));

const productPageLoadedEpic = action$ =>
  action$.ofType(newProductActions.PRODUCT_PAGE_LOADED)
    .flatMap(() =>
      Rx.Observable.of(
        newProductActions.newProductFetchCategories(),
        newProductActions.productFetchStatuses()
      )
    );

const newProductLocationLoadedEpic = action$ =>
  action$.ofType(LOCATION_CHANGE)
    .filter(action => action.payload.pathname === '/create_product' && action.payload.search !== '?edition=true')
    .map(() => newProductActions.productPageLoaded());

export default (action$) =>
  Rx.Observable.merge(
    saveProductEpic(action$),
    savedProductEpic(action$),
    fetchCategoriesEpic(action$),
    fetchStatusesEpic(action$),
    fetchProductEpic(action$),
    productPageLoadedEpic(action$),
    newProductLocationLoadedEpic(action$)
  ).do(() => null, error => record(error), () => null);
