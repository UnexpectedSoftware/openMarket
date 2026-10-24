import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import {push} from 'react-router-redux';
import OpenMarket from '../../../application/index';
import {toast} from '../../components/toast';
import {record, userText} from '../../../infrastructure/logging/ErrorLog';
import * as listProductsActions from './action';
import {makeCategoriesEpic, makeProductsListEpic} from './epicFactory';
import {makePrintCatalogEpic} from './printEpic';

const listProducts = OpenMarket.get('products_list_all_use_case');
const listCategories = OpenMarket.get('categories_list_all_use_case');

const listProductsDetailEpic = action$ =>
  action$.filter(action => action.type === listProductsActions.LIST_PRODUCTS_DETAIL)
    .mergeMap(action => OpenMarket.get('products_find_use_case').findProductByBarcode({
      barcode: barcodeOf(action.payload)
    }).map(product => formProduct(product, imageOf(action.payload))))
    .mergeMap(product => Rx.Observable.of(
      listProductsActions.listProductsDetailLoaded(product),
      push({
        pathname: '/create_product',
        search: '?edition=true'
      })
    ));

const disabledToast = () => toast.success(
  'Product disabled',
  'It stays on the catalog and drops out of the low stock list.'
);

const listProductsDisableEpic = action$ =>
  action$.filter(action => action.type === listProductsActions.LIST_PRODUCTS_DISABLE)
    .mergeMap(action =>
      OpenMarket.get('products_disable_use_case').disable({barcode: action.payload.barcode})
        .mergeMap(() => Rx.Observable.of(
          listProductsActions.listProductsDisabled(action.payload.barcode),
          disabledToast()
        ))
        .catch(disableError => {
          record(disableError);
          return Rx.Observable.of(toast.error(
            'Product was not disabled',
            userText(disableError, 'Product was not disabled')
          ));
        })
    );

const printCatalogEpic = makePrintCatalogEpic({
  printProductCatalog: OpenMarket.get('products_print_catalog_use_case'),
  catalogPrintProgressed: listProductsActions.catalogPrintProgressed,
  catalogPrintFinished: listProductsActions.catalogPrintFinished
});

/**
 * @param {string | {barcode?: string}} payload
 * @returns {string}
 */
function barcodeOf(payload) {
  if (payload && typeof payload === 'object') {
    return payload.barcode;
  }
  return payload;
}

/**
 * @param {string | {imageUrl?: string | null}} payload
 * @returns {string | null}
 */
function imageOf(payload) {
  if (payload && typeof payload === 'object') {
    return payload.imageUrl || null;
  }
  return null;
}

/**
 * @param {object} product
 * @param {string | null} imageUrl
 */
function formProduct(product, imageUrl) {
  return {
    barcode: product.barcode,
    basePrice: product.basePrice.toEuros(),
    description: product.description,
    name: product.name,
    price: product.price.toEuros(),
    vatRate: product.vatRate.code(),
    status: product.status,
    stock: product.stock,
    stockMin: product.stockMin,
    weighted: product.isWeighted,
    categoryId: product.category.id,
    imageSrc: imageUrl
  };
}

export default (action$, store) =>
  Rx.Observable.merge(
    makeProductsListEpic(listProducts)(action$, store),
    makeCategoriesEpic(listCategories)(action$),
    listProductsDetailEpic(action$),
    listProductsDisableEpic(action$),
    printCatalogEpic(action$, store)
  ).do(() => null, epicError => record(epicError));
