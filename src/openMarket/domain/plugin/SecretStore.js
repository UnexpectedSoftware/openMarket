/** @import { Observable } from 'rxjs/Observable' */

/**
 * Port: encrypted settings for one plugin. The value is never written as plaintext.
 * @interface
 */
export default class SecretStore {

  /**
   * @param {{pluginId: string, key: string, value: string}} params
   * @returns {Observable<null>}
   */
  put({pluginId, key, value}) {
    throw new Error('SecretStore#put must be implemented');
  }

  /**
   * Completes with null when this plugin has no value for the key.
   * @param {{pluginId: string, key: string}} params
   * @returns {Observable<string | null>}
   */
  get({pluginId, key}) {
    throw new Error('SecretStore#get must be implemented');
  }

  /**
   * @param {{pluginId: string, key: string}} params
   * @returns {Observable<null>}
   */
  remove({pluginId, key}) {
    throw new Error('SecretStore#remove must be implemented');
  }

  /**
   * @returns {Observable<{available: boolean, backend: string}>}
   */
  status() {
    throw new Error('SecretStore#status must be implemented');
  }

}
