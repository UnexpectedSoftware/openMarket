import {sumEuros} from "../../i18n/money";
import {shopMoment} from "../../i18n/shopTime";

export const defaultLimit = 20;
export const defaultOffset = 0;

export const state = () => {
  return {
    orders: [],
    filters: {
      startDate: shopMoment().startOf("month").startOf("day"),
      endDate: shopMoment().endOf("day"),
      offset: defaultOffset,
      limit: defaultLimit
    },
    total_pages: 0,
    current_page: 0,
    total: 0.0
  }
};


export const calculateTotal = ({orders}) => {
  return orders
    .map(order => order.total)
    .reduce((acc, element) => sumEuros([acc, element]), 0)
}
