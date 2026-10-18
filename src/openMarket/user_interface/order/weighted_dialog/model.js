export const state = () => {
  return {
    visible: false
  };
};

export const showDialog = product => {
  return {
    visible: true,
    product: product,
    replace: !!(product && product.replaceQuantity),
    initialValues: product && product.initialQuantity != null
      ? {quantity: product.initialQuantity}
      : undefined
  };
}






