import * as listProductsActions from './action';
import * as Rx from 'rxjs';
import {push} from 'react-router-redux';
import {success, error} from 'react-notification-system-redux';
import OpenMarket from '../../../application/index';
import ImageStore, {imagesDirectory} from '../../../infrastructure/service/ImageStore';
import {record, userText} from '../../../infrastructure/logging/ErrorLog';
import {catalogLimit, defaultCatalogSort} from './model';
import {makePrintCatalogEpic} from './printEpic';

const images = new ImageStore({directory: imagesDirectory('product-images')});

function toCard(product) {
  const category = product.category;
  return {
    barcode: product.barcode,
    name: product.name,
    price: product.price,
    stock: product.stock,
    status: product.status,
    categoryName: category && category.name ? category.name : '',
    imageSrc: images.readDataUrl(product.imageName)
  };
}

function cursorFrom(product) {
  const stock = product.stock;
  return {
    name: product.name == null ? '' : String(product.name),
    stock: stock == null || !Number.isFinite(Number(stock)) ? null : Number(stock),
    barcode: product.barcode
  };
}

function snapshot(page, {after, append}) {
  return {
    query: page.query || '',
    lowStock: !!page.lowStock,
    status: page.status || null,
    categoryId: page.categoryId || null,
    sort: page.sort || defaultCatalogSort,
    after,
    append,
    limit: catalogLimit
  };
}

function loadPage(action) {
  const filters = action.payload;
  return OpenMarket.get('products_list_all_use_case').findCatalog({
    query: filters.query,
    lowStock: filters.lowStock,
    status: filters.status || null,
    categoryId: filters.categoryId,
    sort: filters.sort || defaultCatalogSort,
    after: filters.after,
    limit: filters.limit
  })
    .map(page => {
      const last = page.products[page.products.length - 1];
      return listProductsActions.listProductsFetched({
        query: filters.query,
        lowStock: !!filters.lowStock,
        status: filters.status || null,
        categoryId: filters.categoryId || null,
        sort: filters.sort || defaultCatalogSort,
        products: page.products.map(toCard),
        hasMore: page.hasMore,
        nextCursor: page.hasMore && last ? cursorFrom(last) : null,
        append: !!filters.append
      });
    })
    .catch(fetchError => {
      record(fetchError);
      return Rx.Observable.of(listProductsActions.listProductsFetchFailed({
        query: filters.query,
        lowStock: !!filters.lowStock,
        status: filters.status || null,
        categoryId: filters.categoryId || null,
        sort: filters.sort || defaultCatalogSort
      }));
    });
}

const fetchReplaceEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_FETCH)
    .filter(action => !action.payload.append)
    .switchMap(loadPage);

const fetchAppendEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_FETCH)
    .filter(action => action.payload.append)
    .flatMap(loadPage);

const pageLoadedEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_PAGE_LOADED)
    .flatMap(action => Rx.Observable.merge(
      Rx.Observable.of(listProductsActions.listProductsFetch({
        query: action.payload.query || '',
        lowStock: !!action.payload.lowStock,
        status: action.payload.status || null,
        categoryId: action.payload.categoryId || null,
        sort: action.payload.sort || defaultCatalogSort,
        after: null,
        append: false,
        limit: action.payload.limit || catalogLimit
      })),
      OpenMarket.get('categories_list_all_use_case').findAllWithStats()
        .map(categories => listProductsActions.listProductsCategoriesLoaded(
          categories
            .map(category => ({id: category.id, name: category.name}))
            .sort((left, right) => left.name.localeCompare(right.name))
        ))
    ));

const queryChangedEpic = (action$, store) =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_QUERY_CHANGED)
    .debounceTime(300)
    .map(() => listProductsActions.listProductsFetch(
      snapshot(store.getState().listProducts, {after: null, append: false})
    ));

const filtersChangedEpic = (action$, store) =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_FILTERS_CHANGED)
    .map(() => listProductsActions.listProductsFetch(
      snapshot(store.getState().listProducts, {after: null, append: false})
    ));

const loadMoreEpic = (action$, store) =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_LOAD_MORE)
    .map(() => {
      const page = store.getState().listProducts;
      if (!page.hasMore || !page.nextCursor) {
        return null;
      }
      return listProductsActions.listProductsFetch(
        snapshot(page, {after: page.nextCursor, append: true})
      );
    })
    .filter(action => action);

const listProductsDetailEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_DETAIL)
    .flatMap(action => OpenMarket.get('products_find_use_case').findProductByBarcode({
      barcode: action.payload
    }))
    .map(product => ({
      barcode: product.barcode,
      basePrice: product.basePrice,
      description: product.description,
      name: product.name,
      price: product.price,
      status: product.status,
      stock: product.stock,
      stockMin: product.stockMin,
      weighted: product.isWeighted,
      categoryId: product.category.id,
      imageSrc: images.readDataUrl(product.imageName)
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

const disabledToast = () => success({
  title: 'Product disabled',
  message: 'It stays on the catalog and drops out of the low stock list.',
  position: 'tr',
  autoDismiss: 4
});

const printCatalogEpic = makePrintCatalogEpic({
  printProductCatalog: OpenMarket.get('products_print_catalog_use_case'),
  successNotification: success,
  errorNotification: error,
  catalogPrintProgressed: listProductsActions.catalogPrintProgressed,
  catalogPrintFinished: listProductsActions.catalogPrintFinished
});

const listProductsDisableEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_DISABLE)
    .flatMap(action =>
      OpenMarket.get('products_disable_use_case').disable({barcode: action.payload.barcode})
        .mergeMap(() => Rx.Observable.of(
          listProductsActions.listProductsDisabled(action.payload.barcode),
          disabledToast()
        ))
        .catch(disableError => {
          record(disableError);
          return Rx.Observable.of(error({
            title: 'Product was not disabled',
            message: userText(disableError, 'Product was not disabled'),
            position: 'tr',
            autoDismiss: 4
          }));
        })
    );

export default (action$, store) =>
  Rx.Observable.merge(
    fetchReplaceEpic(action$),
    fetchAppendEpic(action$),
    pageLoadedEpic(action$),
    queryChangedEpic(action$, store),
    filtersChangedEpic(action$, store),
    loadMoreEpic(action$, store),
    listProductsDetailEpic(action$),
    listProductsDisableEpic(action$),
    printCatalogEpic(action$, store)
  ).do(() => null, (epicError) => record(epicError));
