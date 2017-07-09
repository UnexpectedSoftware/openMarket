import moment from "moment";

export const state = () => {
  return {
    orders: [],
    filters: {
      startDate: moment(),
      endDate: moment()
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
