
const nodeExternals = require("webpack-node-externals");
const {resolve} = require("path");

const shared = require("./webpack.config.shared");

module.exports = {
  entry: [
    "./appsrc/tests/runner.ts"
  ],
  output: {
    path: resolve(__dirname, "tests"),
    filename: "runner.js",
    libraryTarget: "commonjs2",
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  devtool: "inline-source-map",

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loaders: ["awesome-typescript-loader"],
      },
      shared.imageRule,
      shared.sourceMapRule,
      shared.tslintRule,
    ],
  },

  externals: [nodeExternals()],

  target: "electron-main",

  node: {
    __dirname: false,
    __filename: false,
  },
};
