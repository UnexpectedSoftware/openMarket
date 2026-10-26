const MAX_DIGITS = 6;

/**
 * The next quantity text after one keypad key.
 * Digits append, `clear` returns 0, `back` drops the last digit, and anything else is ignored.
 * @param {string | number | null | undefined} current
 * @param {string | null | undefined} key
 * @returns {string}
 */
export function nextKeypadQuantity(current, key) {
  const text = current == null || current === '' ? '0' : String(current);
  if (key === 'clear') {
    return '0';
  }
  if (key === 'back') {
    const cut = text.slice(0, -1);
    return cut === '' ? '0' : cut;
  }
  if (!isDigit(key) || (text !== '0' && text.length >= MAX_DIGITS)) {
    return text;
  }
  if (text === '0') {
    return key;
  }
  return text + key;
}

/**
 * @param {string | null | undefined} key
 * @returns {boolean}
 */
function isDigit(key) {
  return typeof key === 'string' && key.length === 1 && key >= '0' && key <= '9';
}
