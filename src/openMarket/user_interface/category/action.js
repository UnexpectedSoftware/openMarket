// @flow
export const CATEGORIES_PAGE_LOADED = 'CATEGORIES_PAGE_LOADED';
export const CATEGORIES_FETCHED = 'CATEGORIES_FETCHED';
export const CATEGORIES_SAVE = 'CATEGORIES_SAVE';
export const CATEGORIES_SAVED = 'CATEGORIES_SAVED';
export const CATEGORIES_FORM_CLEARED = 'CATEGORIES_FORM_CLEARED';

export const categoriesPageLoaded = () => ({ type: CATEGORIES_PAGE_LOADED });
export const categoriesFetched = categories => ({ type: CATEGORIES_FETCHED, categories });
export const categoriesSave = category => ({ type: CATEGORIES_SAVE, category });
export const categoriesSaved = () => ({ type: CATEGORIES_SAVED });
export const categoriesFormCleared = () => ({ type: CATEGORIES_FORM_CLEARED });
