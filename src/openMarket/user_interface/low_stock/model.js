/**
 * How many enabled products are at or below their minimum.
 * `count` stays null until the first successful read.
 * @returns {{count: number | null, status: string}}
 */
export function state() {
  return {
    count: null,
    status: 'idle'
  };
}

/**
 * @param {{count: number | null, status: string} | null | undefined} current
 * @returns {{count: number | null, status: string}}
 */
export function requested(current) {
  return {
    ...(current || state()),
    status: 'loading'
  };
}

/**
 * @param {{count: number | null, status: string} | null | undefined} current
 * @param {number} count
 * @returns {{count: number, status: string}}
 */
export function loaded(current, count) {
  return {
    ...(current || state()),
    count: wholeCount(count),
    status: 'ready'
  };
}

/**
 * Keeps the last count. A failed refresh does not pretend the shop has none.
 * @param {{count: number | null, status: string} | null | undefined} current
 * @returns {{count: number | null, status: string}}
 */
export function failed(current) {
  return {
    ...(current || state()),
    status: 'error'
  };
}

/**
 * @param {number} count
 * @returns {number}
 */
function wholeCount(count) {
  const value = Number(count);
  if (!Number.isFinite(value) || value < 1) {
    return 0;
  }
  return Math.floor(value);
}
