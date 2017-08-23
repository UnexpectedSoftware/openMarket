export const state = () => {
  return {
    visible: false
  };
};

export const showDialog = product => {
  return {
    visible: true,
    product: product
  };
}






