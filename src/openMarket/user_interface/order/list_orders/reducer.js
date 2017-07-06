import {LIST_ORDER_FETCHED} from './action';


const initialState = {
  orders: []
};

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case LIST_ORDER_FETCHED:
      return {
        ...state,
        orders: action.payload
      };

    default:
      return state;
  }

}
