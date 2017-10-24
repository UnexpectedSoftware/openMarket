import { LOCATION_CHANGE } from 'react-router-redux';
import {
  EDIT_PRODUCT_FETCHED, NEW_PRODUCT_FETCHED_CATEGORIES, NEW_PRODUCT_SAVED, PRODUCT_CLOSE,
  PRODUCT_FETCHED_STATUSES, PRODUCT_PAGE_LOADED
} from './action';
import {LIST_PRODUCTS_DETAIL_LOADED} from "../list_products/action";


const initialState = {
  categories: [],
  statuses: [],
  initialValues: {},
  edition: false
};

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case NEW_PRODUCT_FETCHED_CATEGORIES:
      return {
        ...state,
        categories: action.payload
      };
    case PRODUCT_FETCHED_STATUSES:
      return {
        ...state,
        statuses: action.payload
      };

    case LIST_PRODUCTS_DETAIL_LOADED:
      return {
        ...state,
        initialValues:action.payload,
        edition:true
      };

    case NEW_PRODUCT_SAVED:
      return initialState;

    case PRODUCT_CLOSE:
      return initialState;

    case PRODUCT_PAGE_LOADED:
      return initialState;

    default:
      return state;
  }

}
