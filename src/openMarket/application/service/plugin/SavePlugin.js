import * as Rx from 'rxjs';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/toArray';
import PluginNotFoundError from '../../../domain/plugin/PluginNotFoundError';
import PluginSettingsIncompleteError from '../../../domain/plugin/PluginSettingsIncompleteError';
import observableError from '../../../infrastructure/logging/observableError';
/** @import { Observable } from 'rxjs/Observable' */
/** @import PluginSource from '../../../domain/plugin/PluginSource' */
/** @import PluginRepository from '../../../domain/plugin/PluginRepository' */
/** @import SecretStore from '../../../domain/plugin/SecretStore' */

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
   * @param {{pluginSource: PluginSource, pluginRepository: PluginRepository, secretStore?: SecretStore}} deps
   */
  constructor({pluginSource, pluginRepository, secretStore}) {
    this._pluginSource = pluginSource;
    this._pluginRepository = pluginRepository;
    this._secretStore = secretStore || null;
  }

  /**
   * @param {{pluginId: string, enabled: boolean, config?: Record<string, string>}} command
   * @returns {Observable<null>}
   */
  save({pluginId, enabled, config}) {
    const entered = textConfig(config);
    return this._pluginSource.list().flatMap(discovered => {
      const plugin = discovered.find(item => item.id === pluginId);
      if (!plugin) {
        return observableError(new PluginNotFoundError({pluginId}));
      }
      const secretKeys = (plugin.settings || []).filter(setting => setting.secret).map(setting => setting.key);
      const publicConfig = {};
      const secrets = [];
      Object.keys(entered).forEach(key => {
        if (secretKeys.indexOf(key) !== -1) {
          if (entered[key].trim() !== '') {
            secrets.push({key, value: entered[key]});
          }
        } else {
          publicConfig[key] = entered[key];
        }
      });
      const missingPublic = (plugin.settings || [])
        .filter(setting => setting.required && !setting.secret)
        .map(setting => setting.key)
        .filter(key => publicConfig[key] == null || publicConfig[key].trim() === '');
      const requiredSecrets = enabled
        ? (plugin.settings || []).filter(setting => setting.required && setting.secret).map(setting => setting.key)
        : [];
      return missingSecrets({
        pluginId,
        keys: requiredSecrets,
        provided: secrets.map(item => item.key),
        secretStore: this._secretStore
      }).flatMap(missing => {
        const absent = missingPublic.concat(missing);
        if (enabled && absent.length > 0) {
          return observableError(new PluginSettingsIncompleteError({pluginId, keys: absent}));
        }
        return writeSecrets({secretStore: this._secretStore, pluginId, secrets})
          .flatMap(() => this._pluginRepository.save({
            pluginId,
            enabled: Boolean(enabled),
            config: publicConfig,
            lastError: null
          }));
      });
    });
  }

}

/**
 * @param {object} params
 * @param {string} params.pluginId
 * @param {string[]} params.keys
 * @param {string[]} params.provided
 * @param {SecretStore | null} params.secretStore
 * @returns {Observable<string[]>}
 */
function missingSecrets({pluginId, keys, provided, secretStore}) {
  if (keys.length === 0) {
    return Rx.Observable.of([]);
  }
  return Rx.Observable.from(keys)
    .mergeMap(key => {
      if (provided.indexOf(key) !== -1) {
        return Rx.Observable.of(null);
      }
      if (!secretStore) {
        return Rx.Observable.of(key);
      }
      return secretStore.get({pluginId, key}).map(value => value ? null : key);
    })
    .filter(key => key != null)
    .toArray();
}

/**
 * @param {object} params
 * @param {SecretStore | null} params.secretStore
 * @param {string} params.pluginId
 * @param {Array<{key: string, value: string}>} params.secrets
 * @returns {Observable<null>}
 */
function writeSecrets({secretStore, pluginId, secrets}) {
  return secrets.reduce(
    (writes, item) => writes.flatMap(() => secretStore.put({pluginId, key: item.key, value: item.value})),
    Rx.Observable.of(null)
  );
}
