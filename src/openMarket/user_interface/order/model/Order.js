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
    productQuantity = Number.parseInt(repeatedProduct.quantity) +1;
  }
  lines.push({
    barcode: product.barcode,
    name: product.name,
    price: product.price,
    quantity: productQuantity,
    subtotal: (parseFloat(productQuantity) * parseFloat(product.price))*100/100
  });

  return {
    order: {
      lines,
      total: calculateTotal({lines})
    }
  };
};

export const updateQuantity = ({lines, barcode, quantity}) => {
  let newLines = lines.map(currentProduct => {
    if(!isNaN(quantity) && currentProduct.barcode === barcode ) {
      currentProduct.quantity = quantity;
      currentProduct.subtotal = (parseFloat(quantity) * parseFloat(currentProduct.price))*100/100;
    }
    return currentProduct;
  });
  return {
    order: {
      lines: newLines,
      total: calculateTotal({lines:newLines})
    }
  };

}

const calculateTotal = ({lines}) => {
  let totalOrder = 0.0;
  lines.forEach(product => totalOrder += Number.parseInt(product.quantity)*product.price);
  return parseFloat(totalOrder.toFixed(2));
}


