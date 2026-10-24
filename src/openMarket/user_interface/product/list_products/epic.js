import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mergeMap';
import {push} from 'react-router-redux';
import OpenMarket from '../../../application/index';
import {record} from '../../../infrastructure/logging/ErrorLog';
import * as listProductsActions from './action';
import {
  makeArchiveEpic,
  makeDetailEpic,
  makeImageEpic,
  makeReleaseImageEpic,
  makeSaveEpic,
  makeSavedEpic
} from './drawerEpic';
import {makeCategoriesEpic, makeProductsListEpic} from './epicFactory';
import {makePrintCatalogEpic} from './printEpic';

const listProducts = OpenMarket.get('products_list_all_use_case');
const listCategories = OpenMarket.get('categories_list_all_use_case');

const openProductEpic = action$ =>
  action$.filter(action => action.type === listProductsActions.LIST_PRODUCTS_DETAIL)
    .mergeMap(action => Rx.Observable.of(
      listProductsActions.productsDrawerOpened({mode: 'edit', barcode: barcodeOf(action.payload)}),
      push('/list_products')
    ));

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

export default (action$, store) =>
  Rx.Observable.merge(
    makeProductsListEpic(listProducts)(action$, store),
    makeCategoriesEpic(listCategories)(action$),
    makeDetailEpic(listProducts)(action$),
    makeSaveEpic(OpenMarket.get('products_create_or_update_use_case'))(action$, store),
    makeSavedEpic()(action$),
    makeArchiveEpic(OpenMarket.get('products_disable_use_case'))(action$),
    makeImageEpic(OpenMarket.get('products_find_image_use_case'))(action$, store),
    makeReleaseImageEpic()(action$),
    openProductEpic(action$),
    printCatalogEpic(action$, store)
  ).do(() => null, epicError => record(epicError));
