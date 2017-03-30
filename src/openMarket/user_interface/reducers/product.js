import {FETCH_CATEGORIES_FULFILLED, PRODUCT_SAVED} from '../actions/product';


const initialState = {
  categories: []
};

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case FETCH_CATEGORIES_FULFILLED:
      return {
        ...state,
        categories: action.payload
      };

    case PRODUCT_SAVED:
      return initialState;

    default:
      return state;
  }

}
