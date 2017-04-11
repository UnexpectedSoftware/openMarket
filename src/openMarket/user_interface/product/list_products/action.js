
export const LIST_PRODUCT_FETCH = 'LIST_PRODUCT_FETCH';
export const LIST_PRODUCT_FETCHED = 'LIST_PRODUCT_FETCHED';


export const listProductFetch = () => ({ type: LIST_PRODUCT_FETCH });
export const listProductFetched = payload => ({ type: LIST_PRODUCT_FETCHED,payload});
