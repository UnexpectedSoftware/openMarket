import {state, showDialog} from './model';
import {HIDE_WEIGHTED_DIALOG, SHOW_WEIGHTED_DIALOG} from "./action";

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case SHOW_WEIGHTED_DIALOG:
      return showDialog(action.payload);

    case HIDE_WEIGHTED_DIALOG:
      return initialState;

    default:
      return state;
  }

}
