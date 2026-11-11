/**
 * A string with at least one character that is not white space.
 * @param {*} value
 * @returns {boolean}
 */
export default function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}
