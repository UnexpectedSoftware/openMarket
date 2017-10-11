
export const LIST_PRODUCTS_FETCH = 'LIST_PRODUCTS_FETCH';
export const LIST_PRODUCTS_FETCHED = 'LIST_PRODUCTS_FETCHED';
export const LIST_PRODUCTS_PAGE_LOADED = 'LIST_PRODUCTS_PAGE_LOADED';
export const LIST_PRODUCTS_PAGE_CHANGED = 'LIST_PRODUCTS_PAGE_CHANGED';


export const listProductsFetch = payload => ({ type: LIST_PRODUCTS_FETCH,payload });
export const listProductsFetched = payload => ({ type: LIST_PRODUCTS_FETCHED,payload});
export const listProductsPageLoaded = payload => ({ type: LIST_PRODUCTS_PAGE_LOADED,payload});
export const listProductsPageChanged = payload => ({ type: LIST_PRODUCTS_PAGE_CHANGED,payload});
