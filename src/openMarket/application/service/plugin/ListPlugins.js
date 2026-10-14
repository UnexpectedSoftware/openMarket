import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
/** @import { Observable } from 'rxjs/Observable' */
/** @import PluginSource from '../../../domain/plugin/PluginSource' */
/** @import PluginRepository from '../../../domain/plugin/PluginRepository' */

/**
 * Lists discovered plugins with the enabled flag stored for each one.
 */
export default class ListPlugins {

  /**
   * @param {{pluginSource: PluginSource, pluginRepository: PluginRepository}} deps
   */
  constructor({pluginSource, pluginRepository}) {
    this._pluginSource = pluginSource;
    this._pluginRepository = pluginRepository;
  }

  /**
   * @returns {Observable<{directory: string, plugins: object[]}>}
   */
  list() {
    return this._pluginSource.list().flatMap(discovered =>
      this._pluginRepository.findAll().map(states => ({
        directory: this._pluginSource.directory(),
        plugins: discovered.map(plugin => {
          const state = states.find(item => item.pluginId === plugin.id);
          return {
            id: plugin.id,
            name: plugin.name,
            description: plugin.description,
            version: plugin.version,
            settings: plugin.settings,
            enabled: Boolean(state && state.enabled),
            config: state ? state.config : {},
            lastError: state ? state.lastError : null
          };
        })
      }))
    );
  }

}
