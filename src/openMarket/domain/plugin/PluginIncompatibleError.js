import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A plugin's openmarket range does not include this app, or the range cannot be read.
 */
export default class PluginIncompatibleError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.pluginId]
   * @param {string} [params.range]
   * @param {string} [params.appVersion]
   * @param {boolean} [params.invalid]
   */
  constructor({pluginId, range, appVersion, invalid} = {}) {
    const id = pluginId || 'unknown';
    const message = invalid
      ? `Plugin ${id} has an invalid OpenMarket range "${range}"`
      : `Plugin ${id} requires OpenMarket ${range}, this app is ${appVersion}`;
    super({
      code: ErrorCode.PLUGIN_INCOMPATIBLE,
      message,
      userMessage: 'Plugin is not compatible with this version of OpenMarket',
      context: defined({pluginId, range, appVersion}),
      level: 'warn'
    });
  }

}
