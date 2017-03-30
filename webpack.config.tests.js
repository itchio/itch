
const nodeExternals = require("webpack-node-externals");
const {resolve} = require("path");

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
      { test: /\.tsx?$/, loaders: ["ts-loader"] },
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
    ],
  },

  externals: [nodeExternals()],

  target: "electron-main",

  node: {
    __dirname: false,
    __filename: false,
  },
};
