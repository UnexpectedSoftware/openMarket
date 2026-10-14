import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import PluginNotFoundError from '../../../domain/plugin/PluginNotFoundError';
import PluginSettingsIncompleteError from '../../../domain/plugin/PluginSettingsIncompleteError';
import observableError from '../../../infrastructure/logging/observableError';
/** @import { Observable } from 'rxjs/Observable' */
/** @import PluginSource from '../../../domain/plugin/PluginSource' */
/** @import PluginRepository from '../../../domain/plugin/PluginRepository' */

/**
 * @param {*} config
 * @returns {Record<string, string>}
 */
function textConfig(config) {
  const result = {};
  if (!config || typeof config !== 'object') {
    return result;
  }
  Object.keys(config).forEach(key => {
    if (config[key] != null) {
      result[key] = String(config[key]);
    }
  });
  return result;
}

/**
 * Stores the enabled flag. It does not load the plugin. A restart does that.
 */
export default class SavePlugin {

  /**
   * @param {{pluginSource: PluginSource, pluginRepository: PluginRepository}} deps
   */
  constructor({pluginSource, pluginRepository}) {
    this._pluginSource = pluginSource;
    this._pluginRepository = pluginRepository;
  }

  /**
   * @param {{pluginId: string, enabled: boolean, config?: Record<string, string>}} command
   * @returns {Observable<null>}
   */
  save({pluginId, enabled, config}) {
    const stored = textConfig(config);
    return this._pluginSource.list().flatMap(discovered => {
      const plugin = discovered.find(item => item.id === pluginId);
      if (!plugin) {
        return observableError(new PluginNotFoundError({pluginId}));
      }
      if (enabled) {
        const missing = plugin.settings
          .filter(setting => setting.required)
          .map(setting => setting.key)
          .filter(key => stored[key] == null || stored[key].trim() === '');
        if (missing.length > 0) {
          return observableError(new PluginSettingsIncompleteError({pluginId, keys: missing}));
        }
      }
      return this._pluginRepository.save({
        pluginId,
        enabled: Boolean(enabled),
        config: stored,
        lastError: null
      });
    });
  }

}
