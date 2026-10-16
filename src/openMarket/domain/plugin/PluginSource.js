/** @import { Observable } from 'rxjs/Observable' */

/**
 * One setting the Plugins page asks for.
 * @typedef {object} PluginSetting
 * @property {string} key
 * @property {string} label
 * @property {boolean} required
 * @property {boolean} secret
 */

/**
 * plugin.json plus the folder it was read from. Reading this does not run the plugin.
 * @typedef {object} PluginManifest
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} version
 * @property {string | null} openmarket
 * @property {string} main
 * @property {PluginSetting[]} settings
 * @property {string} directory
 */

/**
 * Port: plugin folders discovered on disk. Reading a manifest does not run the plugin.
 * @interface
 */
export default class PluginSource {

  /**
   * @returns {Observable<PluginManifest[]>}
   */
  list() {
    throw new Error('PluginSource#list must be implemented');
  }

  /**
   * Absolute path of the folder that holds plugin directories.
   * @returns {string}
   */
  directory() {
    throw new Error('PluginSource#directory must be implemented');
  }

}
