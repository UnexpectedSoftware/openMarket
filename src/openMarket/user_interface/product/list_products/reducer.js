import {
  LIST_PRODUCTS_DISABLED,
  LIST_PRODUCTS_FETCH,
  PRODUCTS_CATEGORIES_LOADED,
  PRODUCTS_FAILED,
  PRODUCTS_FILTERS_CHANGED,
  PRODUCTS_LOADED,
  PRODUCTS_PAGE_CHANGED,
  PRODUCTS_PAGE_OPENED,
  PRODUCTS_QUERY_CHANGED
} from './action';
import {
  categoriesLoaded,
  filtersChanged,
  pageChanged,
  pageOpened,
  productDisabled,
  productsFailed,
  productsLoaded,
  queryChanged,
  reloadStarted,
  state
} from './model';

export default function reducer(current = state(), action) {
  switch (action.type) {
    case PRODUCTS_PAGE_OPENED:
      return pageOpened(current, action.payload);
    case PRODUCTS_QUERY_CHANGED:
      return queryChanged(current, action.payload);
    case PRODUCTS_FILTERS_CHANGED:
      return filtersChanged(current, action.payload);
    case PRODUCTS_PAGE_CHANGED:
      return pageChanged(current, action.payload);
    case LIST_PRODUCTS_FETCH:
      return reloadStarted(current);
    case PRODUCTS_LOADED:
      return productsLoaded(current, action.payload);
    case PRODUCTS_FAILED:
      return productsFailed(current, action.payload);
    case PRODUCTS_CATEGORIES_LOADED:
      return categoriesLoaded(current, action.payload);
    case LIST_PRODUCTS_DISABLED:
      return productDisabled(current, action.payload);
    default:
      return current;
  }
}
