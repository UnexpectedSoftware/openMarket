/**
 * A scanner burst is at least three keys, each less than 30 ms after the previous one.
 * @param {number[] | null | undefined} timestamps
 * @returns {boolean}
 */
export function isScannerBurst(timestamps) {
  if (!timestamps || timestamps.length < 3) {
    return false;
  }
  for (let index = 1; index < timestamps.length; index += 1) {
    if (timestamps[index] - timestamps[index - 1] >= 30) {
      return false;
    }
  }
  return true;
}

/**
 * Sell-screen shortcut. Null means the key is left for the field.
 * F2, F3 and F4 stay with the nav rail.
 * @param {{key?: string, ctrlKey?: boolean, altKey?: boolean, metaKey?: boolean, shiftKey?: boolean} | null | undefined} event
 * @param {{searchEmpty?: boolean}} [context]
 * @returns {string | null}
 */
export function applyShortcut(event, context) {
  if (!event || event.altKey || event.metaKey) {
    return null;
  }
  const key = event.key;
  const searchEmpty = !!(context && context.searchEmpty);
  if (event.ctrlKey) {
    return key === 'Enter' ? 'charge' : null;
  }
  if (key === 'F12') {
    return 'charge';
  }
  if (key === 'F8') {
    return 'free';
  }
  if (key === 'F9') {
    return 'reprint';
  }
  if (key === '+' || key === '=') {
    return 'quantity-up';
  }
  if (key === '-' || key === '_') {
    return 'quantity-down';
  }
  if (key === 'Delete' || key === 'Supr') {
    return searchEmpty ? 'remove' : null;
  }
  if (key === 'ArrowUp') {
    return 'select-up';
  }
  if (key === 'ArrowDown') {
    return 'select-down';
  }
  if (key === 'Escape') {
    return 'clear-search';
  }
  if ((key === '?' || (key === '/' && event.shiftKey)) && searchEmpty) {
    return 'help';
  }
  return null;
}
