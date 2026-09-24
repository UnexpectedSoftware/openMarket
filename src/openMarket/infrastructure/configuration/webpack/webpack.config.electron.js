/**
 * Production main-process bundle written to dist/main.js.
 */

import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import baseConfig, { appVersion, root } from './webpack.config.base';

export default merge(baseConfig, {
  mode: 'production',
  devtool: 'source-map',

  entry: ['./src/openMarket/user_interface/main.development.js'],

  output: {
    path: path.join(root, 'dist'),
    filename: 'main.js'
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.OPENMARKET_VERSION': JSON.stringify(appVersion)
    })
  ],

  externals: {
    electron: 'commonjs electron',
    'electron-debug': 'commonjs electron-debug',
    'electron-devtools-installer': 'commonjs electron-devtools-installer',
    'source-map-support': 'commonjs source-map-support'
  },

  target: 'electron-main',

  node: {
    __dirname: false,
    __filename: false
  }
});
