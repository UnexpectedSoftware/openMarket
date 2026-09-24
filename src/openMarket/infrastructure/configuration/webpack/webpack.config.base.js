/**
 * Shared webpack settings. Each concrete config sets mode, target, and output.
 */

import fs from 'fs';
import path from 'path';

export const root = path.resolve(__dirname, '../../../../..');

export const appVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;

export default {
  context: root,
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  performance: {
    hints: false
  }
};
