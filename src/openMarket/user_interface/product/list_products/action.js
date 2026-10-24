export const PRODUCTS_PAGE_OPENED = 'PRODUCTS_PAGE_OPENED';
export const PRODUCTS_QUERY_CHANGED = 'PRODUCTS_QUERY_CHANGED';
export const PRODUCTS_FILTERS_CHANGED = 'PRODUCTS_FILTERS_CHANGED';
export const PRODUCTS_PAGE_CHANGED = 'PRODUCTS_PAGE_CHANGED';
export const PRODUCTS_LOADED = 'PRODUCTS_LOADED';
export const PRODUCTS_FAILED = 'PRODUCTS_FAILED';
export const PRODUCTS_CATEGORIES_LOADED = 'PRODUCTS_CATEGORIES_LOADED';

export const LIST_PRODUCTS_FETCH = 'LIST_PRODUCTS_FETCH';
export const LIST_PRODUCTS_DETAIL = 'LIST_PRODUCTS_DETAIL';
export const LIST_PRODUCTS_DETAIL_LOADED = 'LIST_PRODUCTS_DETAIL_LOADED';
export const LIST_PRODUCTS_DISABLE = 'LIST_PRODUCTS_DISABLE';
export const LIST_PRODUCTS_DISABLED = 'LIST_PRODUCTS_DISABLED';
export const LIST_PRODUCTS_PRINT = 'LIST_PRODUCTS_PRINT';
export const CATALOG_PRINT_PROGRESSED = 'CATALOG_PRINT_PROGRESSED';
export const CATALOG_PRINT_FINISHED = 'CATALOG_PRINT_FINISHED';

/** @param {{query?: string, lowStock?: boolean, status?: string | null, categoryId?: string | null, weighted?: boolean | null, sort?: string, limit?: number}} payload */
export const productsPageOpened = payload => ({type: PRODUCTS_PAGE_OPENED, payload});

/** @param {string} payload */
export const productsQueryChanged = payload => ({type: PRODUCTS_QUERY_CHANGED, payload});

/** @param {{lowStock?: boolean, status?: string | null, categoryId?: string | null, weighted?: boolean | null, sort?: string}} payload */
export const productsFiltersChanged = payload => ({type: PRODUCTS_FILTERS_CHANGED, payload});

/** @param {{offset: number}} payload */
export const productsPageChanged = payload => ({type: PRODUCTS_PAGE_CHANGED, payload});

/** @param {object} payload */
export const productsLoaded = payload => ({type: PRODUCTS_LOADED, payload});

/** @param {object} payload */
export const productsFailed = payload => ({type: PRODUCTS_FAILED, payload});

/** @param {Array<{id: string, name: string}>} payload */
export const productsCategoriesLoaded = payload => ({type: PRODUCTS_CATEGORIES_LOADED, payload});

/** Reloads the open page after a photo fetch. The list epic reads the store. */
export const listProductsFetch = payload => ({type: LIST_PRODUCTS_FETCH, payload});

/** @param {string | {barcode: string, imageUrl?: string | null}} payload */
export const listProductsDetail = payload => ({type: LIST_PRODUCTS_DETAIL, payload});

/** @param {object} payload */
export const listProductsDetailLoaded = payload => ({type: LIST_PRODUCTS_DETAIL_LOADED, payload});

/** @param {{barcode: string}} payload */
export const listProductsDisable = payload => ({type: LIST_PRODUCTS_DISABLE, payload});

/** @param {string} payload */
export const listProductsDisabled = payload => ({type: LIST_PRODUCTS_DISABLED, payload});

export const listProductsPrint = () => ({type: LIST_PRODUCTS_PRINT});

/** @param {number} percent */
export const catalogPrintProgressed = percent => ({type: CATALOG_PRINT_PROGRESSED, percent});

export const catalogPrintFinished = () => ({type: CATALOG_PRINT_FINISHED});
