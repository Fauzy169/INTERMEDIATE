const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/scripts/index.js'),
    sw: path.resolve(__dirname, 'src/sw.js'),
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.js'],
    modules: [
      path.resolve(__dirname, 'src/scripts'),
      'node_modules'
    ],
    alias: {
      '@': path.resolve(__dirname, 'src/scripts'),
      '@utils': path.resolve(__dirname, 'src/scripts/utils'),
      '@data': path.resolve(__dirname, 'src/scripts/data'),
      '@pages': path.resolve(__dirname, 'src/scripts/pages')
    },
  },
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      L: 'leaflet'
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      favicon: path.resolve(__dirname, 'src/public/favicon.png'),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/public/'),
          to: path.resolve(__dirname, 'dist/'),
        },
        {
          from: path.resolve(__dirname, 'src/manifest.json'),
          to: path.resolve(__dirname, 'dist/'),
        },
        {
          from: path.resolve(__dirname, 'src/sw.js'),
          to: 'sw.js',  // ✅ Ini memastikan file ada di root dist/
        },
      ],
    }),
  ],
};
