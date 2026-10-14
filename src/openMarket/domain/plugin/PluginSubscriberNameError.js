import ErrorCode from '../error/ErrorCode.js';
import AppError, {defined} from '../error/AppError.js';

/**
 * A plugin registered a durable subscriber under another plugin's name.
 */
export default class PluginSubscriberNameError extends AppError {

  /**
   * @param {object} [params]
   * @param {string} [params.pluginId]
   * @param {string} [params.subscriberName]
   */
  constructor({pluginId, subscriberName} = {}) {
    const prefix = `${pluginId || 'plugin'}:`;
    super({
      code: ErrorCode.PLUGIN_SUBSCRIBER_NAME_INVALID,
      message: `Durable subscriber "${subscriberName}" must start with "${prefix}"`,
      userMessage: 'Plugin subscriber name is invalid',
      context: defined({pluginId, subscriberName}),
      level: 'error'
    });
  }

}
