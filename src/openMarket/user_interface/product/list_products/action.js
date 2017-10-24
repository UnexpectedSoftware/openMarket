
export const LIST_PRODUCTS_FETCH = 'LIST_PRODUCTS_FETCH';
export const LIST_PRODUCTS_FETCHED = 'LIST_PRODUCTS_FETCHED';
export const LIST_PRODUCTS_PAGE_LOADED = 'LIST_PRODUCTS_PAGE_LOADED';
export const LIST_PRODUCTS_PAGE_CHANGED = 'LIST_PRODUCTS_PAGE_CHANGED';
export const LIST_PRODUCTS_DETAIL = 'LIST_PRODUCTS_DETAIL';
export const LIST_PRODUCTS_DETAIL_LOADED = 'LIST_PRODUCTS_DETAIL_LOADED';

export const LIST_PRODUCTS_FILTER_CHANGED = 'LIST_PRODUCTS_FILTER_CHANGED';
export const LIST_PRODUCTS_BARCODE_FILTER_CHANGED = 'LIST_PRODUCTS_BARCODE_FILTER_CHANGED';
export const LIST_PRODUCTS_NAME_FILTER_CHANGED = 'LIST_PRODUCTS_NAME_FILTER_CHANGED';
export const LIST_PRODUCTS_FILTER_RESETED = 'LIST_PRODUCTS_FILTER_RESETED';

export const listProductsFetch = payload => ({ type: LIST_PRODUCTS_FETCH,payload });
export const listProductsFetched = payload => ({ type: LIST_PRODUCTS_FETCHED,payload});
export const listProductsPageLoaded = payload => ({ type: LIST_PRODUCTS_PAGE_LOADED,payload});
export const listProductsPageChanged = payload => ({ type: LIST_PRODUCTS_PAGE_CHANGED,payload});

export const listProductsDetail = payload => ({ type: LIST_PRODUCTS_DETAIL,payload});
export const listProductsDetailLoaded = payload => ({ type: LIST_PRODUCTS_DETAIL_LOADED,payload});
export const listProductsFilterChanged = payload => ({ type: LIST_PRODUCTS_FILTER_CHANGED,payload});
export const listProductsBarcodeFilterChanged = payload => ({ type: LIST_PRODUCTS_BARCODE_FILTER_CHANGED,payload});
export const listProductsNameFilterChanged = payload => ({ type: LIST_PRODUCTS_NAME_FILTER_CHANGED,payload});
export const listProductsFilterReseted = () => ({ type: LIST_PRODUCTS_FILTER_RESETED});
