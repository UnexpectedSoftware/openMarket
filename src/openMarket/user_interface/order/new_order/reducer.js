import {NEW_ORDER_PRODUCT_FETCHED, NEW_ORDER_PRODUCT_QUANTITY_CHANGE} from './action';
import {state,addProduct, updateQuantity} from '../model/Order';

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case NEW_ORDER_PRODUCT_FETCHED:
      return addProduct(
        {
          lines: [...state.order.lines],
          product: action.payload
        });

    case NEW_ORDER_PRODUCT_QUANTITY_CHANGE:
     return updateQuantity(
       {
         barcode: action.payload.barcode,
         quantity: action.payload.quantityChanged,
         lines: [...state.order.lines]
       });

    default:
      return state;
  }

}
