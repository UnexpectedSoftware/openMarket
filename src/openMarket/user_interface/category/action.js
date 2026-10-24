export const CATEGORIES_PAGE_LOADED = 'CATEGORIES_PAGE_LOADED';
export const CATEGORIES_QUERY_CHANGED = 'CATEGORIES_QUERY_CHANGED';
export const CATEGORIES_LOADED = 'CATEGORIES_LOADED';
export const CATEGORIES_FAILED = 'CATEGORIES_FAILED';
export const CATEGORIES_DIALOG_OPENED = 'CATEGORIES_DIALOG_OPENED';
export const CATEGORIES_DIALOG_CLOSED = 'CATEGORIES_DIALOG_CLOSED';
export const CATEGORIES_DRAFT_CHANGED = 'CATEGORIES_DRAFT_CHANGED';
export const CATEGORIES_SAVE = 'CATEGORIES_SAVE';
export const CATEGORIES_SAVED = 'CATEGORIES_SAVED';
export const CATEGORIES_SAVE_FAILED = 'CATEGORIES_SAVE_FAILED';
export const CATEGORIES_DELETE = 'CATEGORIES_DELETE';
export const CATEGORIES_DELETED = 'CATEGORIES_DELETED';

export const categoriesPageLoaded = () => ({type: CATEGORIES_PAGE_LOADED});

/** @param {string} text */
export const categoriesQueryChanged = text => ({type: CATEGORIES_QUERY_CHANGED, text});

/** @param {{items: object[], total: number}} payload */
export const categoriesLoaded = payload => ({
  type: CATEGORIES_LOADED,
  items: payload.items,
  total: payload.total
});

/** @param {string} message */
export const categoriesFailed = message => ({type: CATEGORIES_FAILED, message});

/** @param {{mode: 'create'|'edit', id?: string}} payload */
export const categoriesDialogOpened = payload => ({
  type: CATEGORIES_DIALOG_OPENED,
  mode: payload.mode,
  id: payload.id
});

export const categoriesDialogClosed = () => ({type: CATEGORIES_DIALOG_CLOSED});

/** @param {object} patch */
export const categoriesDraftChanged = patch => ({type: CATEGORIES_DRAFT_CHANGED, patch});

export const categoriesSave = () => ({type: CATEGORIES_SAVE});

export const categoriesSaved = () => ({type: CATEGORIES_SAVED});

/** @param {string} message */
export const categoriesSaveFailed = message => ({type: CATEGORIES_SAVE_FAILED, message});

/** @param {string} id */
export const categoriesDelete = id => ({type: CATEGORIES_DELETE, id});

export const categoriesDeleted = () => ({type: CATEGORIES_DELETED});
