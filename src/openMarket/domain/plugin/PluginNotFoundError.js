import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A plugin save named a folder that is not in the plugins directory.
 */
export default class PluginNotFoundError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.pluginId]
   */
  constructor({pluginId} = {}) {
    super({
      code: ErrorCode.PLUGIN_NOT_FOUND,
      message: `Plugin ${pluginId || 'unknown'} is not installed`,
      userMessage: 'Plugin is not installed',
      context: defined({pluginId}),
      level: 'warn'
    });
  }

}
