// @flow

export const NEW_ORDER_SAVE = 'NEW_ORDER_SAVE';
export const NEW_ORDER_SAVED = 'NEW_ORDER_SAVED';

export const NEW_ORDER_PRODUCT_FETCH = 'NEW_ORDER_PRODUCT_FETCH';
export const NEW_ORDER_PRODUCT_FETCHED = 'NEW_ORDER_PRODUCT_FETCHED';

export const NEW_ORDER_PRODUCT_QUANTITY_CHANGE = 'NEW_ORDER_PRODUCT_QUANTITY_CHANGE';
export const NEW_ORDER_PRODUCT_DELETED = 'NEW_ORDER_PRODUCT_DELETED';
export const NEW_ORDER_PRODUCT_NOT_FOUND = 'NEW_ORDER_PRODUCT_NOT_FOUND';

export const newOrderSaved = payload => ({ type: NEW_ORDER_SAVED, payload });
export const newOrderSave = order => ({ type: NEW_ORDER_SAVE,order});

export const newOrderProductFetched = payload => ({ type: NEW_ORDER_PRODUCT_FETCHED,payload});
export const newOrderProductFetch = barcode => ({ type: NEW_ORDER_PRODUCT_FETCH,barcode});

export const newOrderProductQuantityChange = payload => ({ type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE,payload});

export const newOrderProductDeleted = barcode => ({ type: NEW_ORDER_PRODUCT_DELETED,barcode});
export const newOrderProductNotFound = payload => ({ type: NEW_ORDER_PRODUCT_NOT_FOUND,payload});

