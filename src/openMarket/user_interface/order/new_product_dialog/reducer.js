import {state, showDialog} from './model';
import {HIDE_NEW_PRODUCT_DIALOG, SHOW_NEW_PRODUCT_DIALOG} from "./action";

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case SHOW_NEW_PRODUCT_DIALOG:
      return showDialog(action.payload);

    case HIDE_NEW_PRODUCT_DIALOG:
      return initialState;

    default:
      return state;
  }

}
