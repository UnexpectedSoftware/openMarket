
export const NEW_ORDER_SAVE = 'NEW_ORDER_SAVE';
export const NEW_ORDER_SAVED = 'NEW_ORDER_SAVED';

export const NEW_ORDER_PRODUCT_FETCH = 'NEW_ORDER_PRODUCT_FETCH';
export const NEW_ORDER_PRODUCT_FETCHED = 'NEW_ORDER_PRODUCT_FETCHED';

export const NEW_ORDER_PRODUCT_QUANTITY_CHANGE = 'NEW_ORDER_PRODUCT_QUANTITY_CHANGE';
export const NEW_ORDER_PRODUCT_DELETED = 'NEW_ORDER_PRODUCT_DELETED';
export const NEW_ORDER_CLEARED = 'NEW_ORDER_CLEARED';
export const NEW_ORDER_FREE_LINE_ADDED = 'NEW_ORDER_FREE_LINE_ADDED';
export const NEW_ORDER_PRODUCT_NOT_FOUND = 'NEW_ORDER_PRODUCT_NOT_FOUND';
export const NEW_ORDER_NOTE_LOW_STOCK = 'NEW_ORDER_NOTE_LOW_STOCK';
export const SALE_TILES_REQUESTED = 'SALE_TILES_REQUESTED';
export const SALE_TILES_LOADED = 'SALE_TILES_LOADED';
export const SALE_TILES_FAILED = 'SALE_TILES_FAILED';
export const SALE_CATEGORIES_REQUESTED = 'SALE_CATEGORIES_REQUESTED';
export const SALE_CATEGORIES_LOADED = 'SALE_CATEGORIES_LOADED';
export const SALE_CATEGORIES_FAILED = 'SALE_CATEGORIES_FAILED';
export const SALE_CATEGORY_SELECTED = 'SALE_CATEGORY_SELECTED';
export const NEW_ORDER_ERRORS_FOUND = 'NEW_ORDER_ERRORS_FOUND';
export const NEW_ORDER_CLOSED = 'NEW_ORDER_CLOSED';
export const PRINT_ORDER_BUTTON_CLICKED = 'PRINT_ORDER_BUTTON_CLICKED';
export const PRINT_ORDER_FINISHED = 'PRINT_ORDER_FINISHED';
export const PAYMENT_FAILED = 'PAYMENT_FAILED';
export const PAYMENT_PREVIEW_REQUESTED = 'PAYMENT_PREVIEW_REQUESTED';
export const PAYMENT_PREVIEW_LOADED = 'PAYMENT_PREVIEW_LOADED';
export const REPRINT_PREVIEW_REQUESTED = 'REPRINT_PREVIEW_REQUESTED';
export const REPRINT_PREVIEW_LOADED = 'REPRINT_PREVIEW_LOADED';



export const newOrderSaved = payload => ({ type: NEW_ORDER_SAVED, payload });
export const newOrderSave = (order, payment) => ({ type: NEW_ORDER_SAVE, order, payment});

export const newOrderProductFetched = payload => ({ type: NEW_ORDER_PRODUCT_FETCHED,payload});
export const newOrderProductFetch = barcode => ({ type: NEW_ORDER_PRODUCT_FETCH,barcode});

export const newOrderProductQuantityChange = payload => ({ type: NEW_ORDER_PRODUCT_QUANTITY_CHANGE,payload});

export const newOrderProductDeleted = (barcode, index) => ({ type: NEW_ORDER_PRODUCT_DELETED, barcode, index});
export const newOrderCleared = () => ({ type: NEW_ORDER_CLEARED });
export const newOrderFreeLineAdded = payload => ({ type: NEW_ORDER_FREE_LINE_ADDED, payload});
export const newOrderProductNotFound = payload => ({ type: NEW_ORDER_PRODUCT_NOT_FOUND,payload});
export const noteLowStock = payload => ({ type: NEW_ORDER_NOTE_LOW_STOCK, payload});
export const saleTilesRequested = payload => ({ type: SALE_TILES_REQUESTED, payload});
export const saleTilesLoaded = payload => ({ type: SALE_TILES_LOADED, payload});
export const saleTilesFailed = () => ({ type: SALE_TILES_FAILED });
export const saleCategoriesRequested = () => ({ type: SALE_CATEGORIES_REQUESTED });
export const saleCategoriesLoaded = payload => ({ type: SALE_CATEGORIES_LOADED, payload });
export const saleCategoriesFailed = () => ({ type: SALE_CATEGORIES_FAILED });
export const saleCategorySelected = categoryId => ({ type: SALE_CATEGORY_SELECTED, categoryId });
export const newOrderClosed = () => ({ type: NEW_ORDER_CLOSED});
export const printOrderButtonClicked = payload => ({ type: PRINT_ORDER_BUTTON_CLICKED, payload});
export const printOrderFinished = () => ({ type: PRINT_ORDER_FINISHED});
export const paymentFailed = () => ({ type: PAYMENT_FAILED });
export const paymentPreviewRequested = payload => ({ type: PAYMENT_PREVIEW_REQUESTED, payload });
export const paymentPreviewLoaded = payload => ({ type: PAYMENT_PREVIEW_LOADED, payload });
export const reprintPreviewRequested = payload => ({ type: REPRINT_PREVIEW_REQUESTED, payload });
export const reprintPreviewLoaded = payload => ({ type: REPRINT_PREVIEW_LOADED, payload });
export const newOrderErrorsFound = payload => ({ type: NEW_ORDER_ERRORS_FOUND,payload});

