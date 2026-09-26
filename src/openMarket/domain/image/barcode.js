/**
 * Shop PLUs shorter than 8 digits are not GTINs and cannot be looked up.
 * @param {string} barcode
 * @returns {boolean}
 */
export function isProductBarcode(barcode) {
  return /^[0-9]{8}$|^[0-9]{12,13}$/.test(String(barcode || ''));
}
