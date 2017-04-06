
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const {resolve} = require("path");
const shared = require("./webpack.config.shared");

module.exports = {
  entry: [
    "./appsrc/chrome.tsx",
  ],
  output: {
    path: resolve(__dirname, "dist", "app"),
    filename: "chrome.js",
    libraryTarget: "commonjs2"
  },

  devtool: "source-map",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".scss"],
  },

  module: {
    rules: [
      {test: /\.tsx?$/, loaders: ["ts-loader"]},
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          use: [
            {loader: "css-loader"},
            {loader: "resolve-url-loader"},
            {loader: "sass-loader"}
          ],
        }),
      },
      shared.imageRule,
      shared.sourceMapRule,
      shared.tslintRule,
    ],
  },

  target: "electron-renderer",

  /**
   * Disables webpack processing of __dirname and __filename.
   * If you run the bundle in node.js it falls back to these values of node.js.
   * https://github.com/webpack/webpack/issues/2010
   */
  node: {
    __dirname: false,
    __filename: false,
  },

  plugins: [
    new webpack.DefinePlugin({
        "process.env.WEBPACK_NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production")
    }),
    new ExtractTextPlugin("bundle.css"),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "appsrc/index.ejs",
    }),
  ],

  externals: [nodeExternals()],
}
