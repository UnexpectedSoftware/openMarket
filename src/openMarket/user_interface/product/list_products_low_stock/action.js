
export const LIST_PRODUCT_FETCH = 'LIST_PRODUCT_FETCH';
export const LIST_PRODUCT_FETCHED = 'LIST_PRODUCT_FETCHED';
export const LIST_PRODUCT_PAGE_LOADED = 'LIST_PRODUCT_PAGE_LOADED';
export const LIST_PRODUCT_PAGE_CHANGED = 'LIST_PRODUCT_PAGE_CHANGED';


export const listProductFetch = payload => ({ type: LIST_PRODUCT_FETCH,payload });
export const listProductFetched = payload => ({ type: LIST_PRODUCT_FETCHED,payload});
export const listProductPageLoaded = payload => ({ type: LIST_PRODUCT_PAGE_LOADED,payload});
export const listProductPageChanged = payload => ({ type: LIST_PRODUCT_PAGE_CHANGED,payload});
