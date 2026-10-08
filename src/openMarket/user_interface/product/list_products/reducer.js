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
import {state as initialCatalog} from './model';

function byEnabledThenBarcode(left, right) {
  const leftRank = left.status === ProductStatus.ENABLED ? 0 : 1;
  const rightRank = right.status === ProductStatus.ENABLED ? 0 : 1;
  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }
  if (left.barcode < right.barcode) {
    return -1;
  }
  if (left.barcode > right.barcode) {
    return 1;
  }
  return 0;
}

function sameFilters(current, payload) {
  return current.query === payload.query
    && current.lowStock === payload.lowStock
    && current.status === payload.status
    && current.categoryId === payload.categoryId;
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
        products: state.products
          .map(product => (product.barcode === action.payload
            ? {...product, status: ProductStatus.DISABLED}
            : product))
          .sort(byEnabledThenBarcode)
      };

    default:
      return state;
  }
}
