import {LIST_ORDER_FETCHED} from './action';
import {state, calculateTotal} from './ListOrdersModel';

const initialState = state();

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case LIST_ORDER_FETCHED:
      return {
        ...state,
        orders: action.payload,
        total: calculateTotal({orders: action.payload})
      };

    default:
      return state;
  }

}
