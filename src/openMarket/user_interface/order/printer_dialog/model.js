export const state = () => {
  return {
    visible: false
  };
};

export const showDialog = order => {
  return {
    visible: true,
    order: order
  };
}






