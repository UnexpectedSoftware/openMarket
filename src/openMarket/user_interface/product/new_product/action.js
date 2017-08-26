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


export const newProductSaved = () => ({ type: NEW_PRODUCT_SAVED });
export const newProductFetchCategories = () => ({ type: NEW_PRODUCT_FETCH_CATEGORIES });
export const productFetchStatuses = () => ({ type: PRODUCT_FETCH_STATUSES });
export const newProductFetchedCategories = payload => ({ type: NEW_PRODUCT_FETCHED_CATEGORIES,payload});
export const productFetchedStatuses = payload => ({ type: PRODUCT_FETCHED_STATUSES,payload});
export const newProductSave = product => ({ type: NEW_PRODUCT_SAVE,product});
export const editProductFetch = payload => ({ type: EDIT_PRODUCT_FETCH,payload});
export const editProductFetched = payload => ({ type: EDIT_PRODUCT_FETCHED,payload});
export const productClose = () => ({ type: PRODUCT_CLOSE});
export const productPageLoaded = () => ({ type: PRODUCT_PAGE_LOADED});
