/**
 * @param {string} text
 * @returns {number[] | null}
 */
function parseVersion(text) {
  const match = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(String(text).trim());
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2] || 0), Number(match[3] || 0)];
}

/**
 * Negative when left is older, positive when it is newer, zero when equal.
 * A zero part falls through to the next one.
 * @param {number[]} left
 * @param {number[]} right
 * @returns {number}
 */
function compare(left, right) {
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

/**
 * @param {number[]} version
 * @param {string} part
 * @returns {boolean | null}
 */
function satisfiesComparator(version, part) {
  const match = /^(>=|<=|>|<|=)?(\d+(?:\.\d+){0,2})$/.exec(part);
  if (!match) {
    return null;
  }
  const operator = match[1] || '=';
  const target = parseVersion(match[2]);
  if (!target) {
    return null;
  }
  const order = compare(version, target);
  if (operator === '>=') {
    return order >= 0;
  }
  if (operator === '<=') {
    return order <= 0;
  }
  if (operator === '>') {
    return order > 0;
  }
  if (operator === '<') {
    return order < 0;
  }
  return order === 0;
}

/**
 * Space-separated comparators must all match. `||` separates alternatives.
 * A blank range matches every version. There is no space between an operator and its number.
 * @param {{version: string, range: string | null | undefined}} params
 * @returns {{ok: boolean, invalid: boolean}}
 */
export function openMarketCompatibility({version, range}) {
  if (range == null || String(range).trim() === '') {
    return {ok: true, invalid: false};
  }
  const app = parseVersion(version);
  if (!app) {
    return {ok: false, invalid: true};
  }
  const groups = String(range).split('||').map(group => group.trim()).filter(group => group !== '');
  if (groups.length === 0) {
    return {ok: false, invalid: true};
  }
  let matched = false;
  let invalid = false;
  groups.forEach(group => {
    const checks = group.split(/\s+/).map(part => satisfiesComparator(app, part));
    if (checks.some(check => check == null)) {
      invalid = true;
      return;
    }
    if (checks.every(Boolean)) {
      matched = true;
    }
  });
  if (invalid) {
    return {ok: false, invalid: true};
  }
  return {ok: matched, invalid: false};
}
