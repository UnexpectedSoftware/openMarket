/**
 * Keyboard command for the products screen.
 * Enter on a row is handled by the table. Esc is handled by the dialog.
 * F2, F3 and F4 stay with the nav rail.
 * @param {{key?: string, target?: {tagName?: string}}} event
 * @returns {{type: 'search'} | null}
 */
export function productsKey(event) {
  if (!event || isTyping(event)) {
    return null;
  }
  if (event.key === 'F2' || event.key === 'F3' || event.key === 'F4') {
    return null;
  }
  if (event.key === '/') {
    return {type: 'search'};
  }
  return null;
}

/**
 * Slash focuses the search box. It does nothing while the drawer is open.
 * @param {{key?: string, target?: {tagName?: string}}} event
 * @param {boolean} drawerOpen
 * @returns {boolean}
 */
export function wantsSearch(event, drawerOpen) {
  if (drawerOpen) {
    return false;
  }
  const command = productsKey(event);
  return !!(command && command.type === 'search');
}

/**
 * @param {{target?: {tagName?: string}}} event
 * @returns {boolean}
 */
function isTyping(event) {
  const tag = event.target && event.target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}
