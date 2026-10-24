export const PRODUCTS_PAGE_OPENED = 'PRODUCTS_PAGE_OPENED';
export const PRODUCTS_QUERY_CHANGED = 'PRODUCTS_QUERY_CHANGED';
export const PRODUCTS_FILTERS_CHANGED = 'PRODUCTS_FILTERS_CHANGED';
export const PRODUCTS_PAGE_CHANGED = 'PRODUCTS_PAGE_CHANGED';
export const PRODUCTS_LOADED = 'PRODUCTS_LOADED';
export const PRODUCTS_FAILED = 'PRODUCTS_FAILED';
export const PRODUCTS_CATEGORIES_LOADED = 'PRODUCTS_CATEGORIES_LOADED';
export const PRODUCTS_DRAWER_OPENED = 'PRODUCTS_DRAWER_OPENED';
export const PRODUCTS_DRAWER_CLOSED = 'PRODUCTS_DRAWER_CLOSED';
export const PRODUCTS_DETAIL_LOADED = 'PRODUCTS_DETAIL_LOADED';
export const PRODUCTS_DRAWER_FAILED = 'PRODUCTS_DRAWER_FAILED';
export const PRODUCTS_DRAFT_CHANGED = 'PRODUCTS_DRAFT_CHANGED';
export const PRODUCTS_SAVE = 'PRODUCTS_SAVE';
export const PRODUCTS_SAVED = 'PRODUCTS_SAVED';
export const PRODUCTS_SAVE_FAILED = 'PRODUCTS_SAVE_FAILED';
export const PRODUCTS_ARCHIVE_PROMPTED = 'PRODUCTS_ARCHIVE_PROMPTED';
export const PRODUCTS_ARCHIVE_DISMISSED = 'PRODUCTS_ARCHIVE_DISMISSED';
export const PRODUCTS_ARCHIVE = 'PRODUCTS_ARCHIVE';
export const PRODUCTS_ARCHIVED = 'PRODUCTS_ARCHIVED';
export const PRODUCTS_IMAGE_REQUESTED = 'PRODUCTS_IMAGE_REQUESTED';
export const PRODUCTS_IMAGE_FOUND = 'PRODUCTS_IMAGE_FOUND';
export const PRODUCTS_IMAGE_MISSED = 'PRODUCTS_IMAGE_MISSED';

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

/** @param {{mode: 'create'|'edit', barcode?: string}} payload */
export const productsDrawerOpened = payload => ({type: PRODUCTS_DRAWER_OPENED, payload});

export const productsDrawerClosed = () => ({type: PRODUCTS_DRAWER_CLOSED});

/** @param {{barcode: string, draft: object}} payload */
export const productsDetailLoaded = payload => ({type: PRODUCTS_DETAIL_LOADED, payload});

/** @param {{barcode?: string, message?: string}} payload */
export const productsDrawerFailed = payload => ({type: PRODUCTS_DRAWER_FAILED, payload});

/** @param {{field: string, value: *}} payload */
export const productsDraftChanged = payload => ({type: PRODUCTS_DRAFT_CHANGED, payload});

/** @param {{imagePath?: string | null}} [payload] */
export const productsSave = payload => ({type: PRODUCTS_SAVE, payload: payload || {}});

export const productsSaved = () => ({type: PRODUCTS_SAVED});

/** @param {{errors?: Record<string, string>, message?: string, code?: string}} payload */
export const productsSaveFailed = payload => ({type: PRODUCTS_SAVE_FAILED, payload});

export const productsArchivePrompted = () => ({type: PRODUCTS_ARCHIVE_PROMPTED});

export const productsArchiveDismissed = () => ({type: PRODUCTS_ARCHIVE_DISMISSED});

/** @param {{barcode: string}} payload */
export const productsArchive = payload => ({type: PRODUCTS_ARCHIVE, payload});

/** @param {string} payload */
export const productsArchived = payload => ({type: PRODUCTS_ARCHIVED, payload});

export const productsImageRequested = () => ({type: PRODUCTS_IMAGE_REQUESTED});

/** @param {{imagePath: string, imageUrl: string | null}} payload */
export const productsImageFound = payload => ({type: PRODUCTS_IMAGE_FOUND, payload});

/** @param {string} [payload] */
export const productsImageMissed = payload => ({type: PRODUCTS_IMAGE_MISSED, payload});

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
