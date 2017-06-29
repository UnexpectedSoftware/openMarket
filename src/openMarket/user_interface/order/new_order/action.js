// @flow

export const NEW_ORDER_SAVE = 'NEW_ORDER_SAVE';
export const NEW_ORDER_SAVED = 'NEW_ORDER_SAVED';

export const NEW_ORDER_PRODUCT_FETCH = 'NEW_ORDER_PRODUCT_FETCH';
export const NEW_ORDER_PRODUCT_FETCHED = 'NEW_ORDER_PRODUCT_FETCHED';

export const newOrderSaved = () => ({ type: NEW_ORDER_SAVED });
export const newOrderSave = order => ({ type: NEW_ORDER_SAVE,order});

export const newOrderProductFetched = payload => ({ type: NEW_ORDER_PRODUCT_FETCHED,payload});
export const newOrderProductFetch = barcode => ({ type: NEW_ORDER_PRODUCT_FETCH,barcode});
