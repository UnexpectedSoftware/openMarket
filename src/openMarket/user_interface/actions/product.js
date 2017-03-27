// @flow
import type { counterStateType } from '../reducers/counter';
import OpenMarket from '../../index';

export const CREATE_PRODUCT = 'CREATE_PRODUCT';
export const FETCH_CATEGORIES = 'FETCH_CATEGORIES';

export function create() {
  return {
    type: CREATE_PRODUCT
  };
}

export function fetchCategories(){
  return (dispatch,getState) => {
    dispatch({
      type: FETCH_CATEGORIES,
      categories: OpenMarket.get("categories_list_all_use_case").findAll()
    });
  };
}


