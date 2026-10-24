import * as Rx from 'rxjs';
import 'rxjs/add/observable/merge';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import ProductsQuery from '../../../domain/product/ProductsQuery';
import {record, userText} from '../../../infrastructure/logging/ErrorLog';
import {
  LIST_PRODUCTS_FETCH,
  PRODUCTS_FILTERS_CHANGED,
  PRODUCTS_PAGE_CHANGED,
  PRODUCTS_PAGE_OPENED,
  PRODUCTS_QUERY_CHANGED,
  productsCategoriesLoaded,
  productsFailed,
  productsLoaded
} from './action';
import {defaultCatalogSort, PAGE_SIZE} from './model';

const SEARCH_DEBOUNCE_MS = 300;
const LOAD_ERROR = 'No se han podido cargar los productos';

const VIEW_FIELDS = [
  'barcode',
  'name',
  'categoryId',
  'categoryName',
  'priceCents',
  'basePriceCents',
  'marginPercent',
  'vat',
  'stock',
  'stockMin',
  'weighted',
  'status',
  'lowStock',
  'imageUrl'
];

const IMMEDIATE = [
  PRODUCTS_PAGE_OPENED,
  PRODUCTS_FILTERS_CHANGED,
  PRODUCTS_PAGE_CHANGED,
  LIST_PRODUCTS_FETCH
];

/**
 * Latest filter, page, or search wins.
 * @param {{list: Function}} listProducts
 */
export function makeProductsListEpic(listProducts) {
  return (action$, store) => {
    const immediate = action$.filter(action => IMMEDIATE.indexOf(action.type) !== -1);
    const typed = action$
      .filter(action => action.type === PRODUCTS_QUERY_CHANGED)
      .debounceTime(SEARCH_DEBOUNCE_MS);
    return Rx.Observable.merge(immediate, typed).switchMap(() => loadPage(listProducts, store));
  };
}

/**
 * @param {{findAllWithStats: Function}} listCategories
 */
export function makeCategoriesEpic(listCategories) {
  return action$ => action$
    .filter(action => action.type === PRODUCTS_PAGE_OPENED)
    .switchMap(() => listCategories.findAllWithStats()
      .map(categories => productsCategoriesLoaded(sortedCategories(categories)))
      .catch(error => {
        record(error);
        return Rx.Observable.of(productsCategoriesLoaded([]));
      }));
}

/**
 * @param {{list: Function}} listProducts
 * @param {{getState: Function}} store
 */
function loadPage(listProducts, store) {
  const page = readPage(store);
  const stamp = stampOf(page);
  return listProducts.list(criteriaFrom(page))
    .map(result => productsLoaded({
      ...stamp,
      items: (result.items || []).map(viewFields),
      total: result.total
    }))
    .catch(error => {
      record(error);
      return Rx.Observable.of(productsFailed({
        ...stamp,
        message: userText(error, LOAD_ERROR)
      }));
    });
}

/**
 * @param {{getState: Function}} store
 */
function readPage(store) {
  const state = store && store.getState ? store.getState() : {};
  return state.listProducts || {};
}

/**
 * @param {object} page
 * @returns {ProductsQuery}
 */
function criteriaFrom(page) {
  return new ProductsQuery({
    text: String(page.query || '').trim(),
    categoryId: page.categoryId,
    status: page.status,
    weighted: page.weighted,
    lowStock: page.lowStock,
    sort: page.sort || defaultCatalogSort,
    limit: page.limit || PAGE_SIZE,
    offset: page.offset || 0
  });
}

/**
 * @param {object} page
 */
function stampOf(page) {
  return {
    query: page.query || '',
    lowStock: !!page.lowStock,
    status: page.status || null,
    categoryId: page.categoryId || null,
    weighted: page.weighted == null ? null : !!page.weighted,
    sort: page.sort || defaultCatalogSort,
    offset: page.offset || 0
  };
}

/**
 * @param {object} item
 */
function viewFields(item) {
  const copy = {};
  VIEW_FIELDS.forEach(key => {
    copy[key] = item ? item[key] : undefined;
  });
  return copy;
}

/**
 * @param {Array<{id: string, name: string}> | null | undefined} categories
 * @returns {Array<{id: string, name: string}>}
 */
function sortedCategories(categories) {
  return (categories || [])
    .map(category => ({id: category.id, name: category.name}))
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
}
