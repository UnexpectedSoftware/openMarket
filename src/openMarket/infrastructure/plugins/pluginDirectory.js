import fs from 'fs';
import os from 'os';
import path from 'path';
import {userDataDirectory} from '../service/sqliteDatabasePath';

let testDirectory = null;

/**
 * Folder the running app scans for plugins.
 * Tests get a fresh empty directory so they never load ~/.config/OpenMarket/plugins.
 * @returns {string}
 */
export default function pluginDirectory() {
  if (process.env.NODE_ENV === 'test') {
    if (!testDirectory) {
      testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'openmarket-test-plugins-'));
    }
    return testDirectory;
  }
  const root = userDataDirectory() || os.tmpdir();
  const directory = path.join(root, 'plugins');
  fs.mkdirSync(directory, {recursive: true});
  return directory;
}
