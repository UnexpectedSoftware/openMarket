export const defaultLimit = 20;
export const defaultOffset = 0;
import moment from "moment";

export const state = () => {
  return {
    orders: [],
    filters: {
      startDate: moment().startOf("month").startOf("day"),
      endDate: moment().endOf("day"),
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
    .reduce((acc,element) =>{
      return ((parseFloat(acc) + parseFloat(element)).toFixed(2)*100/100);
  },0);
}
