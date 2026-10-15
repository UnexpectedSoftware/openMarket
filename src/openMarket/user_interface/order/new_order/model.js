import {number} from "../../validations/formValidations";
import Quantity from "../../../domain/money/Quantity";
import VatRate from "../../../domain/tax/VatRate";
import VatBreakdown from "../../../domain/tax/VatBreakdown";
import {lineEuros, sumEuros} from "../../i18n/money";

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
    productQuantity = Quantity.from(repeatedProduct.quantity).plus(Quantity.from(quantity)).units;
  }
  const price = euroPrice(product.price);
  lines.push({
    barcode: product.barcode,
    name: product.name,
    price,
    quantity: productQuantity,
    subtotal: lineEuros(price, productQuantity),
    vat: vatOf(product.vatRate)
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
      currentProduct.subtotal = lineEuros(currentProduct.price, quantity);
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
      lines: order.lines.map(line => {
        const price = euroPrice(line.price);
        const quantity = line.quantity != null && line.quantity.units != null ? line.quantity.units : line.quantity;
        return {
          barcode: line.barcode,
          name: line.name,
          price,
          quantity,
          subtotal: line.amount != null ? euroPrice(line.amount) : lineEuros(price, quantity),
          vat: vatOf(line.vatRate)
        };
      }),
      total: euroPrice(order.total),
      createdAt: order.createdAt
    },
    readonly:true
  });


const calculateTotal = ({lines}) => sumEuros(lines.map(product => product.subtotal));

export function vatLines(lines) {
  return VatBreakdown.fromLines((lines || []).map(line => ({
    amount: line.subtotal,
    vatRate: line.vat || VatRate.standard()
  }))).map(row => ({
    label: row.rate.kind === 'E' ? 'Exento ' + row.rate.cause
      : row.rate.kind === 'N' ? 'No sujeto ' + row.rate.cause
        : row.rate.percent + ' %',
    base: row.base.toEuros(),
    quota: row.quota.toEuros()
  }));
}

function vatOf(rate) {
  if (rate == null) {
    return VatRate.standard().toJSON();
  }
  return VatRate.from(rate).toJSON();
}

function euroPrice(value) {
  if (value != null && typeof value.toEuros === 'function') {
    return value.toEuros();
  }
  return value;
}


