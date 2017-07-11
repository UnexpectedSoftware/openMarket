import {LIST_ORDER_FETCHED, LIST_ORDER_FILTERS_START_DATE_CHANGED, LIST_ORDER_FILTERS_END_DATE_CHANGED} from './action';
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

    case LIST_ORDER_FILTERS_START_DATE_CHANGED:
      return {
        ...state,
        filters: {
          ...state.filters,
          startDate: action.payload
        }
      }

    case LIST_ORDER_FILTERS_END_DATE_CHANGED:
      return {
        ...state,
        filters: {
          ...state.filters,
          endDate: action.payload
        }
      }

    default:
      return state;
  }

}
