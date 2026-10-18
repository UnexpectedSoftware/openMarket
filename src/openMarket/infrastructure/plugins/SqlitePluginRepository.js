import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/defer';
import {rethrow} from '../logging/ErrorLog';
/** @typedef {import('../../domain/plugin/PluginRepository').default} PluginRepository */
/** @typedef {import('../../domain/plugin/PluginRepository').PluginState} PluginState */

const UPSERT_SQL = 'INSERT INTO plugin_state (plugin_id, enabled, config_json, last_error) ' +
  'VALUES (?, ?, ?, ?) ' +
  'ON CONFLICT(plugin_id) DO UPDATE SET enabled = excluded.enabled, ' +
  'config_json = excluded.config_json, last_error = excluded.last_error';

const FIND_ALL_SQL = 'SELECT plugin_id AS pluginId, enabled, config_json AS configJson, ' +
  'last_error AS lastError FROM plugin_state ORDER BY plugin_id ASC';

/**
 * @param {string | null} json
 * @returns {Record<string, string>}
 */
function configFrom(json) {
  try {
    const value = JSON.parse(json || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    const config = {};
    Object.keys(value).forEach(key => {
      if (value[key] != null) {
        config[key] = String(value[key]);
      }
    });
    return config;
  } catch (error) {
    return {};
  }
}

/**
 * @implements {PluginRepository}
 */
export default class SqlitePluginRepository {

  /**
   * @param {{connection: {database: any}}} deps
   */
  constructor({connection}) {
    this._database = connection.database;
    this._save = this._database.prepare(UPSERT_SQL);
    this._findAll = this._database.prepare(FIND_ALL_SQL);
  }

  /**
   * @param {PluginState} params
   * @returns {import('rxjs/Observable').Observable<null>}
   */
  save({pluginId, enabled, config, lastError}) {
    return Rx.Observable.defer(() => {
      try {
        this._save.run(
          String(pluginId),
          enabled ? 1 : 0,
          JSON.stringify(config || {}),
          lastError == null || lastError === '' ? null : String(lastError)
        );
      } catch (error) {
        rethrow(error, {message: 'Could not save the plugin', context: {pluginId, operation: 'save'}});
      }
      return Rx.Observable.of(null);
    });
  }

  /**
   * @returns {import('rxjs/Observable').Observable<PluginState[]>}
   */
  findAll() {
    return Rx.Observable.defer(() => Rx.Observable.of(this._findAll.all().map(
      /** @param {{pluginId: string, enabled: number | null, configJson: string | null, lastError: string | null}} row */
      row => ({
        pluginId: row.pluginId,
        enabled: Number(row.enabled) === 1,
        config: configFrom(row.configJson),
        lastError: row.lastError || null
      })
    )));
  }

}
