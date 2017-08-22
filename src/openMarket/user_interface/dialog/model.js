export const state = () => {
  return {
    visible: false,
    message: ''
  };
};

export const showDialog = (message) => {
  return {
    visible: true,
    message: message
  };
}






