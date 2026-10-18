import * as Rx from 'rxjs';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/toArray';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/plugin/PluginSource').default} PluginSource */
/** @typedef {import('../../../domain/plugin/PluginRepository').default} PluginRepository */
/** @typedef {import('../../../domain/plugin/SecretStore').default} SecretStore */

/**
 * Lists discovered plugins with the enabled flag stored for each one.
 */
export default class ListPlugins {

  /**
   * @param {{pluginSource: PluginSource, pluginRepository: PluginRepository, secretStore?: SecretStore}} deps
   */
  constructor({pluginSource, pluginRepository, secretStore}) {
    this._pluginSource = pluginSource;
    this._pluginRepository = pluginRepository;
    this._secretStore = secretStore || null;
  }

  /**
   * @returns {Observable<{directory: string, encryption: {available: boolean, backend: string}, plugins: object[]}>}
   */
  list() {
    const encryption = this._secretStore
      ? this._secretStore.status()
      : Rx.Observable.of({available: false, backend: 'unknown'});
    return this._pluginSource.list().flatMap(discovered =>
      this._pluginRepository.findAll().flatMap(states =>
        encryption.flatMap(backend => Rx.Observable.from(discovered.length ? discovered : [null])
          .filter(plugin => plugin != null)
          .mergeMap(plugin => storedSecretKeys(this._secretStore, plugin).map(storedSecrets => {
            const state = states.find(item => item.pluginId === plugin.id);
            const secretKeys = (plugin.settings || []).filter(setting => setting.secret).map(setting => setting.key);
            const config = {};
            Object.keys(state && state.config ? state.config : {}).forEach(key => {
              if (secretKeys.indexOf(key) === -1) {
                config[key] = state.config[key];
              }
            });
            return {
              id: plugin.id,
              name: plugin.name,
              description: plugin.description,
              version: plugin.version,
              settings: plugin.settings,
              storedSecrets,
              enabled: Boolean(state && state.enabled),
              config,
              lastError: state ? state.lastError : null
            };
          }))
          .toArray()
          .map(plugins => ({
            directory: this._pluginSource.directory(),
            encryption: backend,
            plugins
          })))
      )
    );
  }

}

/**
 * @param {SecretStore | null} secretStore
 * @param {{id: string, settings?: Array<{key: string, secret?: boolean}>}} plugin
 * @returns {Observable<string[]>}
 */
function storedSecretKeys(secretStore, plugin) {
  const keys = (plugin.settings || []).filter(setting => setting.secret).map(setting => setting.key);
  if (!secretStore || keys.length === 0) {
    return Rx.Observable.of([]);
  }
  return Rx.Observable.from(keys)
    .mergeMap(key => secretStore.get({pluginId: plugin.id, key}).map(value => value ? key : null))
    .filter(key => key != null)
    .toArray();
}
