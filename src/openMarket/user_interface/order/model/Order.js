export const initialState = () => {
  return {
    order: {
      lines: [],
      total: 0,
    }
  };
};

export const addProduct = ({ lines, product }) => {
  let repeatedProduct = lines.find(currentProduct => currentProduct.barcode === product.barcode);
  let productQuantity = 1;
  if (undefined !== repeatedProduct) {
    lines = lines.filter(currentProduct => currentProduct.barcode !== product.barcode);
    productQuantity = repeatedProduct.quantity +1;
  }
  lines.push({
    barcode: product.barcode,
    name: product.name,
    quantity: productQuantity,
    price: product.price
  });

  let state = initialState();
  state.order.lines = lines;
  state.order.total = calculateTotal({lines});

  return state;
};

const calculateTotal = ({lines}) => {
  let totalOrder = 0.0;
  lines.forEach(product => totalOrder += Math.round(product.quantity*product.price*100)/100);
  return totalOrder;
}


