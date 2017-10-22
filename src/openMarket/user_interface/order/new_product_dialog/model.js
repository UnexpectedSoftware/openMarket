export const state = () => {
  return {
    visible: false,
    initialValues: {}
  };
};

export const showDialog = barcode => {
  return {
    visible: true,
    initialValues: {barcode}
  };
}






