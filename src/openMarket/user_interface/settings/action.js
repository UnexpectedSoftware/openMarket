export const SHOP_PROFILE_REQUESTED = 'SHOP_PROFILE_REQUESTED';
export const SHOP_PROFILE_LOADED = 'SHOP_PROFILE_LOADED';
export const SHOP_PROFILE_SAVE_REQUESTED = 'SHOP_PROFILE_SAVE_REQUESTED';
export const SHOP_PROFILE_SAVED = 'SHOP_PROFILE_SAVED';
export const SHOP_PROFILE_FAILED = 'SHOP_PROFILE_FAILED';

export function shopProfileRequested() {
  return {type: SHOP_PROFILE_REQUESTED};
}

/**
 * @param {object} profile
 */
export function shopProfileLoaded(profile) {
  return {type: SHOP_PROFILE_LOADED, profile};
}

/**
 * @param {object} command
 */
export function shopProfileSaveRequested(command) {
  return {type: SHOP_PROFILE_SAVE_REQUESTED, command};
}

/**
 * @param {object} profile
 */
export function shopProfileSaved(profile) {
  return {type: SHOP_PROFILE_SAVED, profile};
}

/**
 * @param {string} message
 */
export function shopProfileFailed(message) {
  return {type: SHOP_PROFILE_FAILED, message};
}
