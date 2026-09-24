/**
 * Renderer bundle served by the hot-reload middleware.
 */

import webpack from 'webpack';
import { merge } from 'webpack-merge';
import baseConfig, { appVersion, root } from './webpack.config.base';
import path from 'path';

const port = process.env.PORT || 3000;

const sassLoader = {
  loader: 'sass-loader',
  options: {
    sassOptions: {
      silenceDeprecations: ['import', 'legacy-js-api', 'global-builtin', 'color-functions', 'slash-div']
    }
  }
};

export default merge(baseConfig, {
  mode: 'development',
  devtool: 'cheap-module-source-map',

  entry: [
    `webpack-hot-middleware/client?path=http://localhost:${port}/__webpack_hmr&reload=true`,
    './src/openMarket/user_interface/index.js'
  ],

  output: {
    path: path.join(root, 'dist'),
    filename: 'bundle.js',
    publicPath: `http://localhost:${port}/dist/`
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', sassLoader]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff2?|ttf|eot|svg|png|jpe?g|gif|ico)(\?.*)?$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext]'
        }
      }
    ]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.OPENMARKET_VERSION': JSON.stringify(appVersion)
    })
  ],

  optimization: {
    emitOnErrors: false
  },

  externals: {
    electron: 'commonjs electron',
    mysql2: 'commonjs mysql2',
    'mysql2/promise': 'commonjs mysql2/promise'
  },

  target: 'electron-renderer'
});
