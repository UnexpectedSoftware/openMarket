export const PLUGINS_PAGE_LOADED = 'PLUGINS_PAGE_LOADED';
export const PLUGINS_LISTED = 'PLUGINS_LISTED';
export const PLUGIN_SAVE_REQUESTED = 'PLUGIN_SAVE_REQUESTED';
export const PLUGINS_SAVED = 'PLUGINS_SAVED';
export const PLUGIN_SAVE_FAILED = 'PLUGIN_SAVE_FAILED';

export function pluginsPageLoaded() {
  return {type: PLUGINS_PAGE_LOADED};
}

/**
 * @param {{directory: string, plugins: object[]}} page
 */
export function pluginsListed(page) {
  return {type: PLUGINS_LISTED, page};
}

/**
 * @param {{pluginId: string, enabled: boolean, config: Record<string, string>}} command
 */
export function pluginSaveRequested(command) {
  return {type: PLUGIN_SAVE_REQUESTED, command};
}

/**
 * @param {{directory: string, plugins: object[]}} page
 */
export function pluginsSaved(page) {
  return {type: PLUGINS_SAVED, page};
}

/**
 * @param {string} message
 */
export function pluginSaveFailed(message) {
  return {type: PLUGIN_SAVE_FAILED, message};
}
