import {
  LIST_PRODUCTS_CATEGORIES_LOADED,
  LIST_PRODUCTS_DISABLED,
  LIST_PRODUCTS_FETCH,
  LIST_PRODUCTS_FETCHED,
  LIST_PRODUCTS_FETCH_FAILED,
  LIST_PRODUCTS_FILTERS_CHANGED,
  LIST_PRODUCTS_LOAD_MORE,
  LIST_PRODUCTS_PAGE_LOADED,
  LIST_PRODUCTS_QUERY_CHANGED
} from './action';
import ProductStatus from '../../../domain/product/ProductStatus';
import {defaultCatalogSort, state as initialCatalog} from './model';

function sameFilters(current, payload) {
  return current.query === payload.query
    && current.lowStock === payload.lowStock
    && current.status === payload.status
    && current.categoryId === payload.categoryId
    && current.sort === payload.sort;
}

function appendProducts(current, incoming) {
  const seen = {};
  current.forEach(product => {
    seen[product.barcode] = true;
  });
  return current.concat(incoming.filter(product => !seen[product.barcode]));
}

const initialState = initialCatalog();

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case LIST_PRODUCTS_PAGE_LOADED:
      return {
        ...state,
        query: action.payload.query || '',
        lowStock: !!action.payload.lowStock,
        status: action.payload.status || null,
        categoryId: action.payload.categoryId || null,
        sort: action.payload.sort || defaultCatalogSort,
        products: [],
        nextCursor: null,
        hasMore: true,
        loading: true
      };

    case LIST_PRODUCTS_QUERY_CHANGED:
      return {
        ...state,
        query: action.payload,
        loading: true
      };

    case LIST_PRODUCTS_FILTERS_CHANGED:
      return {
        ...state,
        lowStock: !!action.payload.lowStock,
        status: action.payload.status || null,
        categoryId: action.payload.categoryId || null,
        sort: action.payload.sort || defaultCatalogSort,
        loading: true
      };

    case LIST_PRODUCTS_LOAD_MORE:
      if (!state.hasMore || state.loading || !state.nextCursor) {
        return state;
      }
      return {
        ...state,
        loading: true
      };

    case LIST_PRODUCTS_FETCH:
      return {
        ...state,
        loading: true
      };

    case LIST_PRODUCTS_CATEGORIES_LOADED:
      return {
        ...state,
        categories: action.payload
      };

    case LIST_PRODUCTS_FETCHED:
      if (!sameFilters(state, action.payload)) {
        return state;
      }
      return {
        ...state,
        products: action.payload.append
          ? appendProducts(state.products, action.payload.products)
          : action.payload.products,
        nextCursor: action.payload.nextCursor,
        hasMore: action.payload.hasMore,
        loading: false
      };

    case LIST_PRODUCTS_FETCH_FAILED:
      if (!sameFilters(state, action.payload)) {
        return state;
      }
      return {
        ...state,
        loading: false
      };

    case LIST_PRODUCTS_DISABLED:
      return {
        ...state,
        products: state.products.map(product => (product.barcode === action.payload
          ? {...product, status: ProductStatus.DISABLED}
          : product))
      };

    default:
      return state;
  }
}
