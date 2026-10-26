/**
 * Next id in a radio group. `delta` is 1 or -1. An unknown current wraps
 * the same way the theme cards always have.
 * @param {string[]} ids
 * @param {string} current
 * @param {number} delta
 * @returns {string}
 */
export function stepChoice(ids, current, delta) {
  const index = ids.indexOf(current);
  const count = ids.length;
  return ids[(index + delta + count) % count];
}

/**
 * Enter and Space select. Arrows move. Anything else is ignored.
 * @param {{key: string}} event
 * @returns {number | null}
 */
export function radioKeyDelta(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    return 0;
  }
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    return 1;
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    return -1;
  }
  return null;
}

/**
 * Selects the focused card, or moves the selection by one arrow step.
 * @param {{key: string, preventDefault: Function, currentTarget: {getAttribute: Function}}} event
 * @param {{ids: string[], applied: string, attribute: string, select: function(string): void, focus: function(string): void}} choice
 */
export function applyRadioKey(event, choice) {
  const delta = radioKeyDelta(event);
  if (delta == null) {
    return;
  }
  event.preventDefault();
  if (delta === 0) {
    choice.select(event.currentTarget.getAttribute(choice.attribute));
    return;
  }
  const next = stepChoice(choice.ids, choice.applied, delta);
  choice.focus(next);
  choice.select(next);
}

