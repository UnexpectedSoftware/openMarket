/**
 * Shared webpack settings. Each concrete config sets mode, target, and output.
 */

import path from 'path';

export const root = path.resolve(__dirname, '../../../../..');

export default {
  context: root,
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  performance: {
    hints: false
  }
};
