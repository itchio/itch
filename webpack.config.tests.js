
const nodeExternals = require("webpack-node-externals");
const {resolve} = require("path");
const WebpackShellPlugin = require("webpack-shell-plugin");

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

  module: {
    rules: [
      { test: /\.tsx?$/, loaders: ["ts-loader"] },
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
    ],
  },

  plugins: [
    new WebpackShellPlugin({
      onBuildExit: "npm run run-tests"
    }),
  ],

  externals: [nodeExternals()],

  target: "node",

  node: {
    __dirname: false,
    __filename: false,
  }
};
