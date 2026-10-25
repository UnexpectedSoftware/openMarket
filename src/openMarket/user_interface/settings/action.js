export const SHOP_PROFILE_REQUESTED = 'SHOP_PROFILE_REQUESTED';
export const SHOP_PROFILE_LOADED = 'SHOP_PROFILE_LOADED';
export const SETTINGS_PAGE_OPENED = 'SETTINGS_PAGE_OPENED';
export const SETTINGS_LOADED = 'SETTINGS_LOADED';
export const SETTINGS_FAILED = 'SETTINGS_FAILED';
export const SETTINGS_DRAFT_CHANGED = 'SETTINGS_DRAFT_CHANGED';
export const SETTINGS_SAVE_REQUESTED = 'SETTINGS_SAVE_REQUESTED';
export const SETTINGS_SAVED = 'SETTINGS_SAVED';
export const SETTINGS_SAVE_FAILED = 'SETTINGS_SAVE_FAILED';

export function shopProfileRequested() {
  return {type: SHOP_PROFILE_REQUESTED};
}

/**
 * Refreshes the stored shop and the sell-screen issuer. The draft stays.
 * @param {object} profile
 */
export function shopProfileLoaded(profile) {
  return {type: SHOP_PROFILE_LOADED, profile};
}

export function settingsPageOpened() {
  return {type: SETTINGS_PAGE_OPENED};
}

/**
 * @param {object} profile
 * @param {string} theme
 * @param {object | null} [ticket]
 */
export function settingsLoaded(profile, theme, ticket) {
  return {type: SETTINGS_LOADED, profile, theme, ticket};
}

/** @param {string} message */
export function settingsFailed(message) {
  return {type: SETTINGS_FAILED, message};
}

/** @param {object} patch */
export function settingsDraftChanged(patch) {
  return {type: SETTINGS_DRAFT_CHANGED, patch};
}

export function settingsSaveRequested() {
  return {type: SETTINGS_SAVE_REQUESTED};
}

/**
 * @param {object} profile
 * @param {string | null} theme
 * @param {object | null} [ticket]
 */
export function settingsSaved(profile, theme, ticket) {
  return {type: SETTINGS_SAVED, profile, theme, ticket};
}

/**
 * @param {{message?: string, fieldErrors?: object, theme?: string}} failure
 */
export function settingsSaveFailed(failure) {
  return {type: SETTINGS_SAVE_FAILED, failure};
}
