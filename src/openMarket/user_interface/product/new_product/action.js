// @flow
import type { counterStateType } from '../../reducers/counter';


export const NEW_PRODUCT_FETCH_CATEGORIES = 'NEW_PRODUCT_FETCH_CATEGORIES';
export const NEW_PRODUCT_FETCHED_CATEGORIES = 'NEW_PRODUCT_FETCHED_CATEGORIES';
export const NEW_PRODUCT_SAVE = 'NEW_PRODUCT_SAVE';
export const NEW_PRODUCT_SAVED = 'NEW_PRODUCT_SAVED';

export const newProductSaved = () => ({ type: NEW_PRODUCT_SAVED });
export const newProductFetchCategories = () => ({ type: NEW_PRODUCT_FETCH_CATEGORIES });
export const newProductFetchedCategories = payload => ({ type: NEW_PRODUCT_FETCHED_CATEGORIES,payload});
export const newProductSave = product => ({ type: NEW_PRODUCT_SAVE,product});
