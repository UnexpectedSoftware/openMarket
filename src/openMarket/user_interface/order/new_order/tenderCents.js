const MAX_CENTS = 99999999;

/**
 * Keypad entry for a tender in cents. `00` appends two zeros. Back drops a digit.
 * @param {number} cents
 * @param {string} key
 * @returns {number}
 */
export function nextTenderCents(cents, key) {
  const current = Number.isInteger(cents) && cents > 0 ? cents : 0;
  if (key === 'back') {
    return Math.trunc(current / 10);
  }
  let next = current;
  if (key === '00') {
    next = current * 100;
  } else if (/^[0-9]$/.test(String(key))) {
    next = current * 10 + Number(key);
  } else {
    return current;
  }
  return next > MAX_CENTS ? current : next;
}
