import {HOME_PAGE_LOADED, HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED} from './action';


const initialState = {
  totalAmountByDays: []
};

export default function reducer(state = initialState, action) {

  switch (action.type) {

    case HOME_PAGE_STATISTICS_TOTAL_AMOUNT_BY_DAYS_LOADED:
      return {
        ...state,
        totalAmountByDays: action.payload
      };

    default:
      return state;
  }

}
