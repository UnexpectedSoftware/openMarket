import {EDIT_PRODUCT_FETCHED, NEW_PRODUCT_FETCHED_CATEGORIES, NEW_PRODUCT_SAVED, PRODUCT_CLOSE} from './action';


const initialState = {
  categories: [],
  initialValues: {}
};

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case NEW_PRODUCT_FETCHED_CATEGORIES:
      return {
        ...state,
        categories: action.payload
      };

    case EDIT_PRODUCT_FETCHED:
      return {
        ...state,
        initialValues:action.payload
      }

    case NEW_PRODUCT_SAVED:
      return initialState;

    case PRODUCT_CLOSE:
      return initialState;

    default:
      return state;
  }

}
