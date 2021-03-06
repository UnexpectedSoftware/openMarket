import {NEW_ORDER_ERRORS_FOUND} from "../order/new_order/action";
import {state, showDialog} from './model';
import {DIALOG_HIDE} from "./action";

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case NEW_ORDER_ERRORS_FOUND:
      return showDialog(action.payload);

    case DIALOG_HIDE:
      return initialState;

    default:
      return state;
  }

}
