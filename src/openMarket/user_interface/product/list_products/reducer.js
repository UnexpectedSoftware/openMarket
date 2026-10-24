import {
  LIST_PRODUCTS_DISABLED,
  LIST_PRODUCTS_FETCH,
  PRODUCTS_ARCHIVED,
  PRODUCTS_ARCHIVE_DISMISSED,
  PRODUCTS_ARCHIVE_PROMPTED,
  PRODUCTS_ARCHIVE,
  PRODUCTS_CATEGORIES_LOADED,
  PRODUCTS_DETAIL_LOADED,
  PRODUCTS_DRAFT_CHANGED,
  PRODUCTS_DRAWER_CLOSED,
  PRODUCTS_DRAWER_FAILED,
  PRODUCTS_DRAWER_OPENED,
  PRODUCTS_FAILED,
  PRODUCTS_FILTERS_CHANGED,
  PRODUCTS_IMAGE_FOUND,
  PRODUCTS_IMAGE_MISSED,
  PRODUCTS_IMAGE_REQUESTED,
  PRODUCTS_LOADED,
  PRODUCTS_PAGE_CHANGED,
  PRODUCTS_PAGE_OPENED,
  PRODUCTS_QUERY_CHANGED,
  PRODUCTS_SAVED,
  PRODUCTS_SAVE,
  PRODUCTS_SAVE_FAILED
} from './action';
import {
  archiveDismissed,
  archivePrompted,
  archiveStarted,
  categoriesLoaded,
  detailLoaded,
  draftChanged,
  drawerClosed,
  drawerFailed,
  drawerOpened,
  filtersChanged,
  imageFound,
  imageMissed,
  imageRequested,
  pageChanged,
  pageOpened,
  productArchived,
  productDisabled,
  productSaved,
  productsFailed,
  productsLoaded,
  queryChanged,
  reloadStarted,
  saveFailed,
  saveRequested,
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
    case PRODUCTS_DRAWER_OPENED:
      return drawerOpened(current, action.payload);
    case PRODUCTS_DRAWER_CLOSED:
      return drawerClosed(current);
    case PRODUCTS_DETAIL_LOADED:
      return detailLoaded(current, action.payload);
    case PRODUCTS_DRAWER_FAILED:
      return drawerFailed(current, action.payload);
    case PRODUCTS_DRAFT_CHANGED:
      return draftChanged(current, action.payload);
    case PRODUCTS_SAVE:
      return saveRequested(current);
    case PRODUCTS_SAVED:
      return productSaved(current);
    case PRODUCTS_SAVE_FAILED:
      return saveFailed(current, action.payload);
    case PRODUCTS_ARCHIVE_PROMPTED:
      return archivePrompted(current);
    case PRODUCTS_ARCHIVE_DISMISSED:
      return archiveDismissed(current);
    case PRODUCTS_ARCHIVE:
      return archiveStarted(current);
    case PRODUCTS_ARCHIVED:
      return productArchived(current, action.payload);
    case PRODUCTS_IMAGE_REQUESTED:
      return imageRequested(current);
    case PRODUCTS_IMAGE_FOUND:
      return imageFound(current, action.payload);
    case PRODUCTS_IMAGE_MISSED:
      return imageMissed(current, action.payload);
    default:
      return current;
  }
}
