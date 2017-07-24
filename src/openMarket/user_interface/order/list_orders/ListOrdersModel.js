import moment from "moment";

export const defaultLimit = 20;
export const defaultOffset = 0;

export const state = () => {
  return {
    orders: [],
    filters: {
      startDate: moment().startOf("month"),
      endDate: moment(),
      offset: defaultOffset,
      limit: defaultLimit
    },
    total: 0.0
  }
};


export const calculateTotal = ({orders}) => {
  return orders
    .map(order => order.total)
    .reduce((acc,element) =>{
      return (parseFloat(acc) + parseFloat(element)).toFixed(2);
  },0);
}
