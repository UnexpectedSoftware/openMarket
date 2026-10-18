export const required = value =>
  value === undefined || value === null || value === '' || value === false ? 'Required' : undefined
const maxLength = max => value =>
  value && value.length > max ? `Must be ${max} characters or less` : undefined
export const maxLength15 = maxLength(15)

const minValue = min => value =>
  value && value < min ? `Must be at least ${min}` : undefined
export const minValue1 = minValue(1)

const blank = value => value === undefined || value === null || value === ''
const asNumber = value => typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'))
const greaterThan = greater => value => blank(value) ? undefined : asNumber(value) <= greater ? `Must be greater than ${greater}` : undefined
const greaterOrEqualThan = greater => value => blank(value) ? undefined : asNumber(value) < greater ? `Must be greater or equals than ${greater}` : undefined
export const greaterThan0 = greaterThan(0);
export const greaterOrEqualsThan0 = greaterOrEqualThan(0);


import VatRate from '../../domain/tax/VatRate';

export const number = n => !isNaN(parseFloat(n)) && isFinite(n) ? undefined : 'Must be a number'

export const vatRateCode = value => {
  if (value == null || value === '') {
    return 'Choose a VAT rate';
  }
  const known = VatRate.options().some(option => option.code === value);
  return known ? undefined : 'Choose a VAT rate';
}



