import fs from 'fs';
import path from 'path';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/defer';
/** @import PluginSource from '../../domain/plugin/PluginSource' */
/** @import { PluginManifest } from '../../domain/plugin/PluginSource' */

const PLUGIN_ID = /^[a-z][a-z0-9-]*$/;

/**
 * @param {string} folder
 * @param {string} main
 * @returns {string | null}
 */
export function entryInside(folder, main) {
  if (typeof main !== 'string' || main.trim() === '' || path.isAbsolute(main)) {
    return null;
  }
  const root = path.resolve(folder);
  const entry = path.resolve(root, main);
  if (entry !== root && !entry.startsWith(root + path.sep)) {
    return null;
  }
  return entry;
}

/**
 * @param {*} value
 * @returns {Array<{key: string, label: string, required: boolean, secret: boolean}>}
 */
function settingsOf(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(item => item && typeof item.key === 'string' && item.key.trim() !== '')
    .map(item => {
      const key = item.key.trim();
      const label = typeof item.label === 'string' && item.label.trim() !== '' ? item.label.trim() : key;
      return {key, label, required: item.required === true, secret: item.secret === true};
    });
}

/**
 * @param {string} folder
 * @param {string} folderName
 * @returns {PluginManifest | null}
 */
function manifestOf(folder, folderName) {
  const file = path.join(folder, 'plugin.json');
  if (!fs.existsSync(file)) {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || parsed.id !== folderName || !PLUGIN_ID.test(folderName)) {
    return null;
  }
  const main = typeof parsed.main === 'string' && parsed.main.trim() !== '' ? parsed.main.trim() : 'index.js';
  if (!entryInside(folder, main)) {
    return null;
  }
  return {
    id: folderName,
    name: typeof parsed.name === 'string' && parsed.name.trim() !== '' ? parsed.name.trim() : folderName,
    description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
    version: typeof parsed.version === 'string' ? parsed.version.trim() : '',
    openmarket: typeof parsed.openmarket === 'string' && parsed.openmarket.trim() !== ''
      ? parsed.openmarket.trim()
      : null,
    main,
    settings: settingsOf(parsed.settings),
    directory: folder
  };
}

/**
 * Reads plugin.json from each child folder. It does not load index.js.
 * @implements {PluginSource}
 */
export default class FolderPluginSource {

  /**
   * @param {{directory: string}} deps
   */
  constructor({directory}) {
    this._directory = directory;
  }

  /**
   * @returns {string}
   */
  directory() {
    return this._directory;
  }

  /**
   * @returns {import('rxjs/Observable').Observable<PluginManifest[]>}
   */
  list() {
    return Rx.Observable.defer(() => {
      let entries;
      try {
        entries = fs.readdirSync(this._directory, {withFileTypes: true});
      } catch (error) {
        return Rx.Observable.of(/** @type {PluginManifest[]} */ ([]));
      }
      /** @type {PluginManifest[]} */
      const plugins = [];
      entries.filter(entry => entry.isDirectory()).forEach(entry => {
        const manifest = manifestOf(path.join(this._directory, entry.name), entry.name);
        if (manifest) {
          plugins.push(manifest);
        }
      });
      plugins.sort((left, right) => left.name.localeCompare(right.name));
      return Rx.Observable.of(plugins);
    });
  }

}
