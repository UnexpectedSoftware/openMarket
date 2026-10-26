export const THEME_PREVIEW_REQUESTED = 'THEME_PREVIEW_REQUESTED';
export const THEME_PREVIEWED = 'THEME_PREVIEWED';
export const THEME_CHANGE_REQUESTED = 'THEME_CHANGE_REQUESTED';
export const THEME_CHANGED = 'THEME_CHANGED';
export const THEME_PREVIEW_DISCARD_REQUESTED = 'THEME_PREVIEW_DISCARD_REQUESTED';
export const THEME_PREVIEW_DISCARDED = 'THEME_PREVIEW_DISCARDED';
export const THEME_CHANGE_FAILED = 'THEME_CHANGE_FAILED';

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
 * @param {string} [previous] theme to restore if the write fails
 */
export function themeChangeRequested(theme, previous) {
  return {type: THEME_CHANGE_REQUESTED, theme, previous};
}

/**
 * @param {string} theme
 */
export function themeChangeFailed(theme) {
  return {type: THEME_CHANGE_FAILED, theme};
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

export const LAYOUT_PREVIEW_REQUESTED = 'LAYOUT_PREVIEW_REQUESTED';
export const LAYOUT_PREVIEWED = 'LAYOUT_PREVIEWED';
export const LAYOUT_CHANGE_REQUESTED = 'LAYOUT_CHANGE_REQUESTED';
export const LAYOUT_CHANGED = 'LAYOUT_CHANGED';
export const LAYOUT_PREVIEW_DISCARD_REQUESTED = 'LAYOUT_PREVIEW_DISCARD_REQUESTED';
export const LAYOUT_PREVIEW_DISCARDED = 'LAYOUT_PREVIEW_DISCARDED';
export const LAYOUT_CHANGE_FAILED = 'LAYOUT_CHANGE_FAILED';

/**
 * @param {string} layout
 */
export function layoutPreviewRequested(layout) {
  return {type: LAYOUT_PREVIEW_REQUESTED, layout};
}

/**
 * @param {string} layout
 */
export function layoutPreviewed(layout) {
  return {type: LAYOUT_PREVIEWED, layout};
}

/**
 * @param {string} layout
 * @param {string} [previous] layout to restore if the write fails
 */
export function layoutChangeRequested(layout, previous) {
  return {type: LAYOUT_CHANGE_REQUESTED, layout, previous};
}

/**
 * @param {string} layout
 */
export function layoutChangeFailed(layout) {
  return {type: LAYOUT_CHANGE_FAILED, layout};
}

/**
 * @param {string} layout
 */
export function layoutChanged(layout) {
  return {type: LAYOUT_CHANGED, layout};
}

/**
 * @param {string} layout saved layout to put back
 */
export function layoutPreviewDiscardRequested(layout) {
  return {type: LAYOUT_PREVIEW_DISCARD_REQUESTED, layout};
}

/**
 * @param {string} layout
 */
export function layoutPreviewDiscarded(layout) {
  return {type: LAYOUT_PREVIEW_DISCARDED, layout};
}
