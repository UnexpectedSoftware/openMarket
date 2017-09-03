import {state, showDialog} from './model';
import {HIDE_PRINTER_DIALOG, SHOW_PRINTER_DIALOG} from "./action";

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case SHOW_PRINTER_DIALOG:
      return showDialog(action.payload);

    case HIDE_PRINTER_DIALOG:
      return initialState;

    default:
      return state;
  }

}
