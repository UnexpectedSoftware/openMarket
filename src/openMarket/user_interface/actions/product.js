// @flow
import type { counterStateType } from '../reducers/counter';

export const CREATE_PRODUCT = 'CREATE_PRODUCT';
export const FETCH_CATEGORIES = 'FETCH_CATEGORIES';
export const FETCH_CATEGORIES_FULFILLED = 'FETCH_CATEGORIES_FULFILLED';

export const create = () => ({ type: CREATE_PRODUCT });

export const fetchCategories = () => ({ type: FETCH_CATEGORIES });

export const fetchCategoriesFulFilled = payload => ({ type: FETCH_CATEGORIES_FULFILLED,payload});


