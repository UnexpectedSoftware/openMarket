export const FALLBACK_SHOP_NAME = 'OpenMarket';
export const FALLBACK_INITIALS = 'OM';

/**
 * Trade name, then legal name. A blank value is no name.
 * @param {{tradeName?: string, legalName?: string} | null | undefined} profile
 * @returns {string}
 */
export function shopName(profile) {
  const trade = trimmed(profile && profile.tradeName);
  if (trade !== '') {
    return trade;
  }
  return trimmed(profile && profile.legalName);
}

/**
 * At most two initials. No letters falls back to OM.
 * @param {string | null | undefined} name
 * @returns {string}
 */
export function shopInitials(name) {
  const words = wordsOf(name);
  if (words.length >= 2) {
    return upper(words[0].charAt(0) + words[1].charAt(0));
  }
  if (words.length === 1) {
    return upper(words[0].slice(0, 2));
  }
  return FALLBACK_INITIALS;
}

/**
 * The rail mark. An empty shop still has a name a screen reader can say.
 * @param {{tradeName?: string, legalName?: string} | null | undefined} profile
 * @returns {{name: string, initials: string}}
 */
export function shopMark(profile) {
  const name = shopName(profile);
  if (name === '') {
    return {name: FALLBACK_SHOP_NAME, initials: FALLBACK_INITIALS};
  }
  return {name, initials: shopInitials(name)};
}

/**
 * @param {string | null | undefined} name
 * @returns {string[]}
 */
function wordsOf(name) {
  const matches = trimmed(name).match(/\p{L}+/gu);
  return matches || [];
}

/**
 * @param {string} value
 * @returns {string}
 */
function upper(value) {
  return value.toLocaleUpperCase('es');
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function trimmed(value) {
  return value == null ? '' : String(value).trim();
}
