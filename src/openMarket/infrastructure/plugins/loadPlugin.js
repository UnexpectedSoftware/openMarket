import {createRequire} from 'module';
import {entryInside} from './FolderPluginSource';

/**
 * Loads a CommonJS plugin entry from disk. The renderer webpack configs
 * externalize `module` and turn off the createRequire parser, which would
 * otherwise replace this call with undefined.
 * @param {{directory: string, main: string}} params
 * @returns {{register: Function}}
 */
export default function loadPlugin({directory, main}) {
  const entry = entryInside(directory, main || 'index.js');
  if (!entry) {
    throw new Error('Plugin main escapes its folder');
  }
  const requirePlugin = createRequire(entry);
  const loaded = requirePlugin(entry);
  const register = loaded && typeof loaded.register === 'function'
    ? loaded.register
    : loaded && loaded.default && typeof loaded.default.register === 'function'
      ? loaded.default.register
      : null;
  if (typeof register !== 'function') {
    throw new Error('Plugin must export register');
  }
  return {register};
}
