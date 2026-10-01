import {
  HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED,
  MOST_SOLD_LOADED,
  MOST_SOLD_REQUESTED
} from './action';
import {DEFAULT_SALES_WINDOW} from '../../application/service/product/salesWindows';

const initialState = {
  totalAmountByDays: [],
  mostSold: {
    window: DEFAULT_SALES_WINDOW,
    products: [],
    loaded: false
  }
};

export default function reducer(state = initialState, action) {

  switch (action.type) {

    case HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED:
      return {
        ...state,
        totalAmountByDays: action.payload
      };

    case MOST_SOLD_REQUESTED:
      return {
        ...state,
        mostSold: {
          ...state.mostSold,
          window: action.window
        }
      };

    case MOST_SOLD_LOADED:
      return {
        ...state,
        mostSold: {
          window: action.payload.window,
          products: action.payload.products,
          loaded: true
        }
      };

    default:
      return state;
  }

}
