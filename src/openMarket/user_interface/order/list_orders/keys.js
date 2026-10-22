/**
 * Keyboard command for the orders list. Enter on a button is left to that button.
 * F2, F3 and F4 stay with the nav rail.
 * @param {{key?: string, target?: {tagName?: string}}} event
 * @param {{customOpen?: boolean, reprintOpen?: boolean, detailOpen?: boolean, selectedOrderId?: string | null}} screen
 * @returns {{type: 'move', delta: number} | {type: 'open', orderId: string} | {type: 'reprint', orderId: string} | {type: 'back'} | null}
 */
export function orderListKey(event, screen) {
  if (isTyping(event) || screen.customOpen || screen.reprintOpen) {
    return null;
  }
  if (event.key === 'F2' || event.key === 'F3' || event.key === 'F4') {
    return null;
  }
  if (event.key === 'F9' && screen.selectedOrderId) {
    return {type: 'reprint', orderId: screen.selectedOrderId};
  }
  if (event.key === 'Escape' && screen.detailOpen) {
    return {type: 'back'};
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
