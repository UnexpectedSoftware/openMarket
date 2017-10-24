export const required = value => value ? undefined : 'Required'
const maxLength = max => value =>
  value && value.length > max ? `Must be ${max} characters or less` : undefined
export const maxLength15 = maxLength(15)

const minValue = min => value =>
  value && value < min ? `Must be at least ${min}` : undefined
export const minValue1 = minValue(1)

const greaterThan = greater => value => value && value <= greater ? `Must be greater than ${greater}` : undefined
const greaterOrEqualThan = greater => value => value && value < greater ? `Must be greater or equals than ${greater}` : undefined
export const greaterThan0 = greaterThan(0);
export const greaterOrEqualsThan0 = greaterOrEqualThan(0);


export const number = n => !isNaN(parseFloat(n)) && isFinite(n) ? undefined : 'Must be a number'



