import {NEW_PRODUCT_FETCHED_CATEGORIES, NEW_PRODUCT_SAVED} from './action';


const initialState = {
  categories: []
};

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case NEW_PRODUCT_FETCHED_CATEGORIES:
      return {
        ...state,
        categories: action.payload
      };

    case NEW_PRODUCT_SAVED:
      return initialState;

    default:
      return state;
  }

}
