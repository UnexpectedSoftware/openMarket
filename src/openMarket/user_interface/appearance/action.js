export const THEME_PREVIEW_REQUESTED = 'THEME_PREVIEW_REQUESTED';
export const THEME_PREVIEWED = 'THEME_PREVIEWED';
export const THEME_CHANGE_REQUESTED = 'THEME_CHANGE_REQUESTED';
export const THEME_CHANGED = 'THEME_CHANGED';
export const THEME_PREVIEW_DISCARD_REQUESTED = 'THEME_PREVIEW_DISCARD_REQUESTED';
export const THEME_PREVIEW_DISCARDED = 'THEME_PREVIEW_DISCARDED';

/**
 * @param {string} theme
 */
export function themePreviewRequested(theme) {
  return {type: THEME_PREVIEW_REQUESTED, theme};
}

/**
 * @param {string} theme
 */
export function themePreviewed(theme) {
  return {type: THEME_PREVIEWED, theme};
}

/**
 * @param {string} theme
 */
export function themeChangeRequested(theme) {
  return {type: THEME_CHANGE_REQUESTED, theme};
}

/**
 * @param {string} theme
 */
export function themeChanged(theme) {
  return {type: THEME_CHANGED, theme};
}

/**
 * @param {string} theme saved theme to put back
 */
export function themePreviewDiscardRequested(theme) {
  return {type: THEME_PREVIEW_DISCARD_REQUESTED, theme};
}

/**
 * @param {string} theme
 */
export function themePreviewDiscarded(theme) {
  return {type: THEME_PREVIEW_DISCARDED, theme};
}
