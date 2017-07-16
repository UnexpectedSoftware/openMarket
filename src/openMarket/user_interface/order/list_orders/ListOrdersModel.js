import moment from "moment";

export const state = () => {
  return {
    orders: [],
    filters: {
      startDate: moment().startOf("month"),
      endDate: moment(),
      offset: 0,
      limit: 10
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
