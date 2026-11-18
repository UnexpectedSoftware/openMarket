/**
 * One status for a discovered plugin. Whether a saved enable applies only
 * after a restart is decided later, when the host records what it loaded.
 */
export const PluginStatus = Object.freeze({
  INCOMPATIBLE: 'INCOMPATIBLE',
  NEEDS_CONFIGURATION: 'NEEDS_CONFIGURATION',
  LOAD_ERROR: 'LOAD_ERROR',
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED'
});

/**
 * @param {*} value
 * @returns {boolean}
 */
function blank(value) {
  return value == null || String(value).trim() === '';
}

/**
 * Required settings that are still empty. A secret counts only when its key
 * is listed in storedSecrets. A value left in config does not satisfy a secret.
 * @param {{settings?: Array<{key: string, label: string, required?: boolean, secret?: boolean}>} | null | undefined} manifest
 * @param {Record<string, string> | null | undefined} config
 * @param {string[] | null | undefined} storedSecrets
 * @returns {Array<{key: string, label: string}>}
 */
export function missingSettings(manifest, config, storedSecrets) {
  const settings = manifest && Array.isArray(manifest.settings) ? manifest.settings : [];
  const values = config && typeof config === 'object' ? config : {};
  const secrets = Array.isArray(storedSecrets) ? storedSecrets : [];
  /** @type {Array<{key: string, label: string}>} */
  const missing = [];
  settings.forEach(setting => {
    if (!setting.required) {
      return;
    }
    const absent = setting.secret
      ? secrets.indexOf(setting.key) === -1
      : blank(values[setting.key]);
    if (absent) {
      missing.push({key: setting.key, label: setting.label});
    }
  });
  return missing;
}

/**
 * @param {object} params
 * @param {{settings?: Array<{key: string, label: string, required?: boolean, secret?: boolean}>}} params.manifest
 * @param {{enabled?: boolean, config?: Record<string, string>, lastError?: string | null} | null} [params.state]
 * @param {string[] | null} [params.storedSecrets]
 * @param {{ok: boolean, invalid: boolean}} params.compatibility
 * @returns {{status: string, missingSettings: Array<{key: string, label: string}>}}
 */
export function pluginStatus({manifest, state, storedSecrets, compatibility}) {
  const enabled = Boolean(state && state.enabled);
  const lastError = state && state.lastError ? state.lastError : null;
  const missing = missingSettings(manifest, state && state.config, storedSecrets);
  if (compatibility.ok === false) {
    return {status: PluginStatus.INCOMPATIBLE, missingSettings: missing};
  }
  if (missing.length !== 0) {
    return {status: PluginStatus.NEEDS_CONFIGURATION, missingSettings: missing};
  }
  if (enabled && lastError) {
    return {status: PluginStatus.LOAD_ERROR, missingSettings: missing};
  }
  if (enabled) {
    return {status: PluginStatus.ACTIVE, missingSettings: missing};
  }
  return {status: PluginStatus.DISABLED, missingSettings: missing};
}
