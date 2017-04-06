
const nodeExternals = require("webpack-node-externals");
const {resolve} = require("path");
const shared = require("./webpack.config.shared");

const port = process.env.PORT || 8009;
const publicPath = `http://localhost:${port}/app`

module.exports = {
  entry: [
    "react-hot-loader/patch",
    `webpack-dev-server/client?http://localhost:${port}/`,
    "webpack/hot/only-dev-server",
    "./appsrc/webpack-require.ts",
    "./appsrc/chrome.tsx",
  ],
  output: {
    path: resolve(__dirname, "app"),
    filename: "chrome.js",
    libraryTarget: "commonjs2",
    publicPath,
  },

  devtool: "eval",

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json", ".scss"],
  },

  module: {
    rules: [
      {test: /\.tsx?$/, loaders: ["react-hot-loader/webpack", "awesome-typescript-loader"]},
      {
        test: /\.scss$/,
        use: [
          {loader: "style-loader"}, {loader: "css-loader"},
          {loader: "resolve-url-loader"}, {loader: "sass-loader"}
        ]
      },
      shared.imageRule,
      shared.sourceMapRule,
      shared.tslintRule,
    ],
  },

  externals: [nodeExternals({whitelist: [/webpack/]})],

  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
  ],

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

  devServer: {
    port,
    hot: true,
    inline: false,
    historyApiFallback: true,
    contentBase: resolve(__dirname, "app"), publicPath,
  },
};
