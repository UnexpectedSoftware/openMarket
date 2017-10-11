import { LOCATION_CHANGE } from 'react-router-redux';
import {
  EDIT_PRODUCT_FETCHED, NEW_PRODUCT_FETCHED_CATEGORIES, NEW_PRODUCT_SAVED, PRODUCT_CLOSE,
  PRODUCT_FETCHED_STATUSES
} from './action';


const initialState = {
  categories: [],
  statuses: [],
  initialValues: {},
  showUpdateFields: false
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

    case EDIT_PRODUCT_FETCHED:
      return {
        ...state,
        initialValues:action.payload,
        showUpdateFields:true
      };

    case NEW_PRODUCT_SAVED:
      return initialState;

    case PRODUCT_CLOSE:
      return initialState;

    default:
      return state;
  }

}
