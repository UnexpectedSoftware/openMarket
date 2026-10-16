import * as Rx from 'rxjs';
import 'rxjs/add/observable/defer';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import {rethrow} from '../logging/ErrorLog';
/** @import SecretStore from '../../domain/plugin/SecretStore' */

const UPSERT_SQL = 'INSERT INTO plugin_secret (plugin_id, key, ciphertext) VALUES (?, ?, ?) ' +
  'ON CONFLICT(plugin_id, key) DO UPDATE SET ciphertext = excluded.ciphertext';
const FIND_SQL = 'SELECT ciphertext FROM plugin_secret WHERE plugin_id = ? AND key = ?';
const DELETE_SQL = 'DELETE FROM plugin_secret WHERE plugin_id = ? AND key = ?';

/**
 * Stores plugin secrets as ciphertext. Encryption happens in the main process.
 * @implements {SecretStore}
 */
export default class SafeStorageSecretStore {

  /**
   * @param {object} deps
   * @param {{database: any}} deps.connection
   * @param {{encrypt: (plain: string) => string | Promise<string>, decrypt: (encoded: string) => string | Promise<string>, status: () => {available: boolean, backend: string} | Promise<{available: boolean, backend: string}>}} deps.bridge
   */
  constructor({connection, bridge}) {
    this._database = connection.database;
    this._bridge = bridge;
  }

  /**
   * @param {{pluginId: string, key: string, value: string}} params
   * @returns {import('rxjs/Observable').Observable<null>}
   */
  put({pluginId, key, value}) {
    const id = String(pluginId);
    const name = String(key);
    return Rx.Observable.defer(() => asObservable(this._bridge.encrypt(String(value))))
      .map(ciphertext => {
        try {
          this._database.prepare(UPSERT_SQL).run(id, name, String(ciphertext));
        } catch (error) {
          rethrow(error, {message: 'Could not store a plugin secret', context: {pluginId: id, key: name, operation: 'put'}});
        }
        return null;
      });
  }

  /**
   * @param {{pluginId: string, key: string}} params
   * @returns {import('rxjs/Observable').Observable<string | null>}
   */
  get({pluginId, key}) {
    const id = String(pluginId);
    const name = String(key);
    return Rx.Observable.defer(() => {
      const row = this._database.prepare(FIND_SQL).get(id, name);
      if (!row || row.ciphertext == null) {
        return Rx.Observable.of(null);
      }
      return asObservable(this._bridge.decrypt(String(row.ciphertext)));
    });
  }

  /**
   * @param {{pluginId: string, key: string}} params
   * @returns {import('rxjs/Observable').Observable<null>}
   */
  remove({pluginId, key}) {
    return Rx.Observable.defer(() => {
      this._database.prepare(DELETE_SQL).run(String(pluginId), String(key));
      return Rx.Observable.of(null);
    });
  }

  /**
   * @returns {import('rxjs/Observable').Observable<{available: boolean, backend: string}>}
   */
  status() {
    return Rx.Observable.defer(() => asObservable(this._bridge.status()));
  }

}

/**
 * A synchronous bridge emits immediately, so startup can read a secret before register.
 * @param {*} result
 * @returns {import('rxjs/Observable').Observable<*>}
 */
function asObservable(result) {
  if (result && typeof result.then === 'function') {
    return Rx.Observable.fromPromise(result);
  }
  return Rx.Observable.of(result);
}
