import * as Rx from 'rxjs';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/toArray';
import {openMarketCompatibility} from '../../../domain/plugin/openMarketCompatibility';
import {pluginStatus} from '../../../domain/plugin/pluginStatus';
/** @template T @typedef {import('rxjs/Observable').Observable<T>} Observable */
/** @typedef {import('../../../domain/plugin/PluginSource').default} PluginSource */
/** @typedef {import('../../../domain/plugin/PluginSource').PluginManifest} PluginManifest */
/** @typedef {import('../../../domain/plugin/PluginRepository').default} PluginRepository */
/** @typedef {import('../../../domain/plugin/PluginRepository').PluginState} PluginState */
/** @typedef {import('../../../domain/plugin/SecretStore').default} SecretStore */

/**
 * Lists discovered plugins with the enabled flag stored for each one.
 */
export default class ListPlugins {

  /**
   * @param {{pluginSource: PluginSource, pluginRepository: PluginRepository, secretStore?: SecretStore, appVersion: string}} deps
   */
  constructor({pluginSource, pluginRepository, secretStore, appVersion}) {
    this._pluginSource = pluginSource;
    this._pluginRepository = pluginRepository;
    this._secretStore = secretStore || null;
    this._appVersion = appVersion;
  }

  /**
   * @returns {Observable<{directory: string, encryption: {available: boolean, backend: string}, appVersion: string, plugins: object[]}>}
   */
  list() {
    const encryption = this._secretStore
      ? this._secretStore.status()
      : Rx.Observable.of({available: false, backend: 'unknown'});
    return this._pluginSource.list().flatMap(discovered =>
      this._pluginRepository.findAll().flatMap(states =>
        encryption.flatMap(backend => Rx.Observable.from(discovered.length ? discovered : [null])
          .filter(plugin => plugin != null)
          .mergeMap(plugin => storedSecretKeys(this._secretStore, plugin).map(storedSecrets =>
            pluginRow({
              plugin,
              state: states.find(item => item.pluginId === plugin.id),
              storedSecrets,
              appVersion: this._appVersion
            })
          ))
          .toArray()
          .map(plugins => ({
            directory: this._pluginSource.directory(),
            encryption: backend,
            appVersion: this._appVersion,
            plugins
          })))
      )
    );
  }

}

/**
 * @param {object} params
 * @param {PluginManifest} params.plugin
 * @param {PluginState | undefined} params.state
 * @param {string[]} params.storedSecrets
 * @param {string} params.appVersion
 * @returns {object}
 */
function pluginRow({plugin, state, storedSecrets, appVersion}) {
  const stored = state || {pluginId: plugin.id, enabled: false, config: {}, lastError: null};
  const secretKeys = (plugin.settings || []).filter(setting => setting.secret).map(setting => setting.key);
  const config = {};
  Object.keys(stored.config || {}).forEach(key => {
    if (secretKeys.indexOf(key) === -1) {
      config[key] = stored.config[key];
    }
  });
  const judged = pluginStatus({
    manifest: plugin,
    state: stored,
    storedSecrets,
    compatibility: openMarketCompatibility({version: appVersion, range: plugin.openmarket})
  });
  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    version: plugin.version,
    openmarket: plugin.openmarket == null ? null : plugin.openmarket,
    settings: plugin.settings,
    storedSecrets,
    enabled: Boolean(stored.enabled),
    config,
    lastError: stored.lastError,
    status: judged.status,
    missingSettings: judged.missingSettings
  };
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
