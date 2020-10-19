const express = require('express');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'data/*.json',
          to: path.resolve(__dirname, 'dist', 'api'),
          flatten: true,
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    open: true,
    port: 9000,
    before: function(app, server) {
      app.use('/api', express.static(path.join(__dirname, 'data')));
    },
  },
};
