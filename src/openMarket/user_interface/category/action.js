// @flow
export const CATEGORIES_PAGE_LOADED = 'CATEGORIES_PAGE_LOADED';
export const CATEGORIES_FETCHED = 'CATEGORIES_FETCHED';
export const CATEGORIES_SAVE = 'CATEGORIES_SAVE';
export const CATEGORIES_SAVED = 'CATEGORIES_SAVED';
export const CATEGORIES_RENAME = 'CATEGORIES_RENAME';
export const CATEGORIES_IMAGE_REPLACE = 'CATEGORIES_IMAGE_REPLACE';
export const CATEGORIES_IMAGE_CLEAR = 'CATEGORIES_IMAGE_CLEAR';
export const CATEGORIES_UPDATED = 'CATEGORIES_UPDATED';
export const CATEGORIES_DELETE = 'CATEGORIES_DELETE';
export const CATEGORIES_DELETED = 'CATEGORIES_DELETED';
export const CATEGORIES_CHANGE_FAILED = 'CATEGORIES_CHANGE_FAILED';

export const categoriesPageLoaded = () => ({ type: CATEGORIES_PAGE_LOADED });
export const categoriesFetched = categories => ({ type: CATEGORIES_FETCHED, categories });
export const categoriesSave = category => ({ type: CATEGORIES_SAVE, category });
export const categoriesSaved = () => ({ type: CATEGORIES_SAVED });
export const categoriesRename = (id, name) => ({ type: CATEGORIES_RENAME, id, name });
export const categoriesImageReplace = (id, imagePath) => ({ type: CATEGORIES_IMAGE_REPLACE, id, imagePath });
export const categoriesImageClear = id => ({ type: CATEGORIES_IMAGE_CLEAR, id });
export const categoriesUpdated = () => ({ type: CATEGORIES_UPDATED });
export const categoriesDelete = id => ({ type: CATEGORIES_DELETE, id });
export const categoriesDeleted = () => ({ type: CATEGORIES_DELETED });
export const categoriesChangeFailed = (id, message) => ({ type: CATEGORIES_CHANGE_FAILED, id, message });
