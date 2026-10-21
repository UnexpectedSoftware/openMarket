/**
 * Keyboard command for the orders list. Enter on a button is left to that button.
 * @param {{key?: string, target?: {tagName?: string}}} event
 * @param {{customOpen?: boolean, selectedOrderId?: string | null}} screen
 * @returns {{type: 'move', delta: number} | {type: 'open', orderId: string} | null}
 */
export function orderListKey(event, screen) {
  if (isTyping(event) || screen.customOpen) {
    return null;
  }
  if (event.key === 'ArrowDown') {
    return {type: 'move', delta: 1};
  }
  if (event.key === 'ArrowUp') {
    return {type: 'move', delta: -1};
  }
  if (event.key === 'Enter' && !isButton(event) && screen.selectedOrderId) {
    return {type: 'open', orderId: screen.selectedOrderId};
  }
  return null;
}

/**
 * @param {{target?: {tagName?: string}}} event
 * @returns {boolean}
 */
function isTyping(event) {
  const tag = event.target && event.target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * @param {{target?: {tagName?: string}}} event
 * @returns {boolean}
 */
function isButton(event) {
  return !!(event.target && event.target.tagName === 'BUTTON');
}
