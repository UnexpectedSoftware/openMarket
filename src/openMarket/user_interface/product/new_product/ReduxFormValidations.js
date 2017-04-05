export const validate = values => {
  const errors = {};

  if (!values.barcode) {
    errors.barcode = 'Required';
  } else if (values.barcode.length > 15) {
    errors.barcode = 'Must be 15 characters or less';
  }
  if (!values.price) {
    errors.price = 'Required';
  } else if (isNaN(Number(values.price))) {
    errors.price = 'Must be a number';
  } else if (Number(values.price) < 0) {
    errors.price = 'Sorry, you must put a number greater than 0';
  }
  return errors;
};
