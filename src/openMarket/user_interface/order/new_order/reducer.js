import {NEW_ORDER_PRODUCT_FETCHED} from './action';
import {state,addProduct} from '../model/Order';

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case NEW_ORDER_PRODUCT_FETCHED:
      return addProduct({ lines: [...state.order.lines], product: action.payload });
    default:
      return state;
  }

}
