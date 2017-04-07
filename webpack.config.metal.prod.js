
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const {resolve} = require("path");

const shared = require("./webpack.config.shared");

module.exports = {
  entry: {
    "metal.js": "./appsrc/metal.ts",
    "inject/itchio-monkeypatch.js": "./appsrc/inject/itchio-monkeypatch.ts",
    "inject/game.js": "./appsrc/inject/game.ts",
  },
  output: {
    path: resolve(__dirname, "dist", "app"),
    filename: "[name]",
    libraryTarget: "commonjs2",
  },

  devtool: "source-map",

  resolve: {extensions: [".ts", ".tsx", ".js", ".json"]},

  module: {
    rules: [
      {test: /\.tsx?$/, loaders: ["ts-loader"]},
      shared.imageRule,
      shared.sourceMapRule,
      shared.tslintRule,
    ],
  },

  target: "electron-main",

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },

  externals: [nodeExternals()],

  plugins: [
    new webpack.DefinePlugin({"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production")}),
  ]
};
