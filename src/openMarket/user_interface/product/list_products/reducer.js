import {LIST_PRODUCT_FETCHED} from './action';
import {state} from './model';

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case LIST_PRODUCT_FETCHED:
      return {
        ...state,
        products: action.payload.products,
        total_pages: Math.ceil(action.payload.total/state.filters.limit),
        current_page:  action.payload.page
      };

    default:
      return state;
  }

}
