const webpack = require('webpack');

module.exports = (input, outDir, outFile) =>
  webpack({
    entry: input,
    output: {
      path: outDir,
      filename: outFile,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: 'babel-loader',
          exclude: /node_modules/,
        },
      ],
    },
  });
