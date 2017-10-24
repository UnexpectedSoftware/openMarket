import {number} from "../../validations/formValidations";
import {add, multiply} from "../../../infrastructure/service/floatCalculatorService";

export const state = () => {
  return {
    order: {
      lines: [],
      total: 0,
    },
    readonly: false
  };
};

export const addProduct = ({ lines, product, quantity }) => {
  let repeatedProduct = lines.find(currentProduct => currentProduct.barcode === product.barcode);
  let productQuantity = quantity;
  if (undefined !== repeatedProduct) {
    lines = lines.filter(currentProduct => currentProduct.barcode !== product.barcode);
    productQuantity = add(repeatedProduct.quantity,quantity);
  }
  lines.push({
    barcode: product.barcode,
    name: product.name,
    price: product.price,
    quantity: productQuantity,
    subtotal: multiply(productQuantity,product.price)
  });

  return {
    ...state(),
    order: {
      lines,
      total: calculateTotal({lines})
    }
  };
};


export const updateQuantity = ({lines, barcode, quantity}) => {
  let newLines = lines.map(currentProduct => {
    if(number(quantity) === undefined && currentProduct.barcode === barcode ) {
      currentProduct.quantity = quantity;
      currentProduct.subtotal = multiply(quantity,currentProduct.price);
    }
    return currentProduct;
  });
  return {
    ...state(),
    order: {
      lines: newLines,
      total: calculateTotal({lines:newLines})
    }
  };

}

export const removeProduct = ({lines, barcode}) =>{
  let newLines = lines.filter(product => product.barcode!==barcode);
  return {
    ...state(),
    order: {
      lines: newLines,
      total: calculateTotal({lines:newLines})
    }
  };
}

export const loadOrder  = ({order}) =>
  ({
    order:{
      lines: order.lines.map(line => ({...line,subtotal:multiply(line.quantity,line.price)})),
      total: order.total,
      createdAt: order.createdAt
    },
    readonly:true
  });


const calculateTotal = ({lines}) => {
  let totalOrder = 0.0;
  lines.forEach(product => totalOrder = add(totalOrder, multiply(product.quantity,product.price)));
  return totalOrder;
}


