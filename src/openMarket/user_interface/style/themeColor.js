/**
 * Reads one theme token from the document. Charts call this while rendering,
 * after the epic has set `data-theme`.
 * @param {string} name token name without the `--om-` prefix, such as `chart-bar`
 * @returns {string}
 */
export function themeColor(name) {
  if (typeof document === 'undefined' || !document.documentElement) {
    return '';
  }
  return getComputedStyle(document.documentElement).getPropertyValue('--om-' + name).trim();
}
