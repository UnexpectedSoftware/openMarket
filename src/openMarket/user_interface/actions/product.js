// @flow
import type { counterStateType } from '../reducers/counter';


export const FETCH_CATEGORIES = 'FETCH_CATEGORIES';
export const FETCH_CATEGORIES_FULFILLED = 'FETCH_CATEGORIES_FULFILLED';
export const SAVE_PRODUCT = 'SAVE_PRODUCT';
export const PRODUCT_SAVED = 'PRODUCT_SAVED';

export const productSaved = () => ({ type: PRODUCT_SAVED });
export const fetchCategories = () => ({ type: FETCH_CATEGORIES });
export const fetchCategoriesFulFilled = payload => ({ type: FETCH_CATEGORIES_FULFILLED,payload});
export const saveProduct = product => ({ type: SAVE_PRODUCT,product});
