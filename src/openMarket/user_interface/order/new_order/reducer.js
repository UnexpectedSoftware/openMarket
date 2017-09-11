import {
  NEW_ORDER_PRODUCT_FETCHED, NEW_ORDER_PRODUCT_QUANTITY_CHANGE, NEW_ORDER_PRODUCT_DELETED, NEW_ORDER_SAVED,
  NEW_ORDER_CLOSED
} from './action';
import {state, addProduct, updateQuantity, removeProduct, loadOrder} from './model';
import {LIST_ORDER_DETAIL_LOADED} from "../list_orders/action";

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case NEW_ORDER_PRODUCT_FETCHED:
      return addProduct(
        {
          lines: [...state.order.lines],
          product: action.payload.product,
          quantity: action.payload.quantity
        });

    case NEW_ORDER_PRODUCT_QUANTITY_CHANGE:
     return updateQuantity(
       {
         barcode: action.payload.barcode,
         quantity: action.payload.quantityChanged,
         lines: [...state.order.lines]
       });

    case NEW_ORDER_PRODUCT_DELETED:
      return removeProduct(
        {
          lines: [...state.order.lines],
          barcode: action.barcode
        });

    case NEW_ORDER_SAVED:
      return initialState;

    case LIST_ORDER_DETAIL_LOADED:
      return loadOrder({
        order: action.payload
      })

    case NEW_ORDER_CLOSED:
      return initialState;

    default:
      return state;
  }

}
