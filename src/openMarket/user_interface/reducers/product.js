import { FETCH_CATEGORIES_FULFILLED } from '../actions/product';


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

    default:
      return state;
  }

}
