import * as listProductsActions from './action';
import * as Rx from 'rxjs';
import {push} from 'react-router-redux';
import {success, error} from 'react-notification-system-redux';
import OpenMarket from '../../../application/index';
import ProductStatus from '../../../domain/product/ProductStatus';
import ImageStore, {imagesDirectory} from '../../../infrastructure/service/ImageStore';
import {catalogLimit} from './model';

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
  return {
    rank: product.status === ProductStatus.ENABLED ? 0 : 1,
    barcode: product.barcode
  };
}

function snapshot(page, {after, append}) {
  return {
    query: page.query || '',
    lowStock: !!page.lowStock,
    disabledOnly: !!page.disabledOnly,
    categoryId: page.categoryId || null,
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
    disabledOnly: filters.disabledOnly,
    categoryId: filters.categoryId,
    after: filters.after,
    limit: filters.limit
  })
    .map(page => {
      const last = page.products[page.products.length - 1];
      return listProductsActions.listProductsFetched({
        query: filters.query,
        lowStock: !!filters.lowStock,
        disabledOnly: !!filters.disabledOnly,
        categoryId: filters.categoryId || null,
        products: page.products.map(toCard),
        hasMore: page.hasMore,
        nextCursor: page.hasMore && last ? cursorFrom(last) : null,
        append: !!filters.append
      });
    })
    .catch(fetchError => {
      console.log(fetchError);
      return Rx.Observable.of(listProductsActions.listProductsFetchFailed({
        query: filters.query,
        lowStock: !!filters.lowStock,
        disabledOnly: !!filters.disabledOnly,
        categoryId: filters.categoryId || null
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
        disabledOnly: !!action.payload.disabledOnly,
        categoryId: action.payload.categoryId || null,
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

const listProductsDisableEpic = action$ =>
  action$.ofType(listProductsActions.LIST_PRODUCTS_DISABLE)
    .flatMap(action =>
      OpenMarket.get('products_disable_use_case').disable({barcode: action.payload.barcode})
        .mergeMap(() => Rx.Observable.of(
          listProductsActions.listProductsDisabled(action.payload.barcode),
          disabledToast()
        ))
        .catch(disableError => Rx.Observable.of(error({
          title: 'Product was not disabled',
          message: disableError && disableError.message ? disableError.message : 'Product was not disabled',
          position: 'tr',
          autoDismiss: 4
        })))
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
    listProductsDisableEpic(action$)
  ).do(() => null, (epicError) => console.log(epicError));
