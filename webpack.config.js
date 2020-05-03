const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './src/index.js',
  target: 'node',
  output: {
    filename: 'service.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: [nodeExternals()]
};