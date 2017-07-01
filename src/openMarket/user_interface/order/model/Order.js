export const state = () => {
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
    price: product.price,
    quantity: productQuantity
  });

  return {
    order: {
      lines,
      total: calculateTotal({lines})
    }
  };
};

const calculateTotal = ({lines}) => {
  let totalOrder = 0.0;
  lines.forEach(product => totalOrder += Math.round(product.quantity*product.price*100)/100);
  return totalOrder;
}


