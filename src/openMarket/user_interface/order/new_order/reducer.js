import {NEW_ORDER_PRODUCT_FETCHED} from './action';

const initialState = {
  order: {
    lines: [],
    total: 0
  }
};

export default function reducer(state = initialState, action) {

  switch (action.type) {
    case NEW_ORDER_PRODUCT_FETCHED:
      let lines = [...state.order.lines];
      let repeatedProduct = lines.find(product => product.barcode === action.payload.barcode);
      let productQuantity = 1;
      let totalOrder = 0.0;
      if (undefined !== repeatedProduct) {
        lines = lines.filter(product => product.barcode !== action.payload.barcode);
        productQuantity = repeatedProduct.quantity +1;
      }
      lines.push({
        barcode: action.payload.barcode,
        name: action.payload.name,
        quantity: productQuantity,
        price: action.payload.price
      });
      lines.forEach(product => totalOrder += Math.round(product.quantity*product.price*100)/100);
      return {
        order: {
          total: totalOrder,
          lines
        }
      };

    default:
      return state;
  }

}
