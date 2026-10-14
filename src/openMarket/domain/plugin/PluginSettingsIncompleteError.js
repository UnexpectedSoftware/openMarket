import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * An enable was refused because a required manifest setting was blank.
 */
export default class PluginSettingsIncompleteError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.pluginId]
   * @param {string[]} [params.keys]
   */
  constructor({pluginId, keys} = {}) {
    const missing = Array.isArray(keys) ? keys.filter(key => key != null && key !== '') : [];
    super({
      code: ErrorCode.PLUGIN_SETTINGS_INCOMPLETE,
      message: `Plugin ${pluginId || 'unknown'} is missing ${missing.join(', ') || 'required settings'}`,
      userMessage: 'Fill in the required plugin settings',
      context: defined({pluginId, keys: missing}),
      level: 'warn'
    });
  }

}
