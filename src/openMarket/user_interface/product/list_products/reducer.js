import {LIST_PRODUCTS_FETCHED, LIST_PRODUCTS_FILTER_RESETED, LIST_PRODUCTS_NAME_FILTER_CHANGED} from './action';
import {state} from './model';

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case LIST_PRODUCTS_FETCHED:
      return {
        ...state,
        products: action.payload.products,
        total_pages: Math.ceil(action.payload.total/state.filters.limit),
        current_page:  action.payload.page
      };

    case LIST_PRODUCTS_NAME_FILTER_CHANGED:
      return {
        ...state,
        filter_type: 'name'
      };

    case LIST_PRODUCTS_FILTER_RESETED:
      return {
        ...state,
        filter_type: undefined
      };

    default:
      return state;
  }

}
