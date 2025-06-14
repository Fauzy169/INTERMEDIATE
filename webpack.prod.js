const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'app.css', // agar file stabil & mudah dicache
    }),
    new WorkboxPlugin.GenerateSW({
      swDest: 'service-worker.js',
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          // ✅ Cache seluruh assets statis (js, css, gambar, favicon, html)
          urlPattern: /\.(?:png|jpg|jpeg|svg|css|js|html)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'assets-cache',
            expiration: {
              maxEntries: 60,
            },
          },
        },
        {
          // ✅ Cache untuk API cerita
          urlPattern: /^https:\/\/story-api\.dicoding\.dev\/v1\/stories/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'stories-api-cache',
          },
        },
      ],
    }),
  ],
});
