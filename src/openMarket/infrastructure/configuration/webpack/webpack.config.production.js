/**
 * Production renderer bundle written to dist/.
 */

import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import baseConfig, { appVersion, root } from './webpack.config.base';

const sassLoader = {
  loader: 'sass-loader',
  options: {
    sassOptions: {
      silenceDeprecations: ['import', 'legacy-js-api', 'global-builtin', 'color-functions', 'slash-div']
    }
  }
};

export default merge(baseConfig, {
  mode: 'production',
  devtool: 'source-map',

  entry: ['./src/openMarket/user_interface/index.js'],

  output: {
    path: path.join(root, 'dist'),
    filename: 'bundle.js',
    publicPath: './'
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
        use: [MiniCssExtractPlugin.loader, 'css-loader', sassLoader]
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
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
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.OPENMARKET_VERSION': JSON.stringify(appVersion)
    }),
    new MiniCssExtractPlugin({ filename: 'style.css' }),
    new HtmlWebpackPlugin({
      filename: 'app.html',
      template: path.join(root, 'src/openMarket/user_interface/app.html'),
      inject: true
    })
  ],

  externals: {
    electron: 'commonjs electron',
    mysql2: 'commonjs mysql2',
    'mysql2/promise': 'commonjs mysql2/promise',
    'node:sqlite': 'commonjs node:sqlite'
  },

  target: 'electron-renderer'
});
