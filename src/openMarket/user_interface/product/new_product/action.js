// @flow


export const NEW_PRODUCT_FETCH_CATEGORIES = 'NEW_PRODUCT_FETCH_CATEGORIES';
export const NEW_PRODUCT_FETCHED_CATEGORIES = 'NEW_PRODUCT_FETCHED_CATEGORIES';
export const PRODUCT_FETCHED_STATUSES = 'PRODUCT_FETCHED_STATUSES';
export const NEW_PRODUCT_SAVE = 'NEW_PRODUCT_SAVE';
export const NEW_PRODUCT_SAVED = 'NEW_PRODUCT_SAVED';
export const EDIT_PRODUCT_FETCH = 'EDIT_PRODUCT_FETCH';
export const EDIT_PRODUCT_FETCHED = 'EDIT_PRODUCT_FETCHED';
export const PRODUCT_CLOSE = 'PRODUCT_CLOSE';
export const PRODUCT_PAGE_LOADED = 'PRODUCT_PAGE_LOADED';
export const PRODUCT_FETCH_STATUSES = 'PRODUCT_FETCH_STATUSES';
export const FIND_PRODUCT_IMAGE = 'FIND_PRODUCT_IMAGE';
export const PRODUCT_IMAGE_FOUND = 'PRODUCT_IMAGE_FOUND';
export const PRODUCT_IMAGE_LOOKUP_FINISHED = 'PRODUCT_IMAGE_LOOKUP_FINISHED';
export const PRODUCT_SALES_WINDOW_SELECTED = 'PRODUCT_SALES_WINDOW_SELECTED';
export const PRODUCT_SALES_LOADED = 'PRODUCT_SALES_LOADED';


export const newProductSaved = ({ edition } = {}) => ({ type: NEW_PRODUCT_SAVED, edition: Boolean(edition) });
export const newProductFetchCategories = () => ({ type: NEW_PRODUCT_FETCH_CATEGORIES });
export const productFetchStatuses = () => ({ type: PRODUCT_FETCH_STATUSES });
export const newProductFetchedCategories = payload => ({ type: NEW_PRODUCT_FETCHED_CATEGORIES,payload});
export const productFetchedStatuses = payload => ({ type: PRODUCT_FETCHED_STATUSES,payload});
export const newProductSave = product => ({ type: NEW_PRODUCT_SAVE,product});
export const editProductFetch = payload => ({ type: EDIT_PRODUCT_FETCH,payload});
export const editProductFetched = payload => ({ type: EDIT_PRODUCT_FETCHED,payload});
export const productClose = () => ({ type: PRODUCT_CLOSE});
export const productPageLoaded = () => ({ type: PRODUCT_PAGE_LOADED});
export const findProductImage = barcode => ({ type: FIND_PRODUCT_IMAGE, barcode });
export const productImageFound = ({imagePath, imageSrc}) => ({ type: PRODUCT_IMAGE_FOUND, imagePath, imageSrc });
export const productImageLookupFinished = () => ({ type: PRODUCT_IMAGE_LOOKUP_FINISHED });
export const productSalesWindowSelected = ({barcode, window}) => ({
  type: PRODUCT_SALES_WINDOW_SELECTED,
  barcode,
  window
});
export const productSalesLoaded = payload => ({ type: PRODUCT_SALES_LOADED, payload });
