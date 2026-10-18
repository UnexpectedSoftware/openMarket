/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */

/**
 * Stored enabled flag and config for one plugin.
 * @typedef {object} PluginState
 * @property {string} pluginId
 * @property {boolean} enabled
 * @property {Record<string, string>} config
 * @property {string | null} lastError
 */

/**
 * Port: enabled flag and saved config for installed plugins, as a collection.
 * @interface
 */
export default class PluginRepository {

  /**
   * @param {PluginState} params
   * @returns {Observable<null>}
   */
  save({pluginId, enabled, config, lastError}) {
    throw new Error('PluginRepository#save must be implemented');
  }

  /**
   * @returns {Observable<PluginState[]>}
   */
  findAll() {
    throw new Error('PluginRepository#findAll must be implemented');
  }

}
