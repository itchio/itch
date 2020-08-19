const { NamedModulesPlugin } = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const HappyPack = require("happypack");
const WebpackBuildNotifierPlugin = require("webpack-build-notifier");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const path = require("path");
const { merge } = require("webpack-merge");

module.exports = (_notSureWhatThatArgumentDoes, env) => {
  // note: webpack-command used to pass `env` as the
  // first argument, but webpack-command died. I advise
  // not switching to webpack-nano, as it's from the same
  // maintainer and might also die. wepback-cli seems to
  // pass env as the second argument.

  return [
    merge(getCommonConfig("main", env), {
      target: "electron-main",
      resolve: {
        alias: { "react-dom": "@hot-loader/react-dom" },
        mainFields: ["electron-main", "module", "main"],
      },
      entry: {
        main: ["./src/main/index.ts"],
        "inject-game": ["./src/main/inject/inject-game.ts"],
        "inject-captcha": ["./src/main/inject/inject-captcha.ts"],
      },
      plugins: [
        new CleanWebpackPlugin(),
        new WebpackBuildNotifierPlugin({
          title: "itch (main)",
        }),
      ],
    }),
    merge(getCommonConfig("renderer", env), {
      target: "electron-renderer",
      resolve: {
        mainFields: ["browser", "module", "main"],
      },
      entry: {
        renderer: ["./src/renderer/index.tsx"],
      },
      externals: ["systeminformation"],
      module: {
        rules: [
          {
            test: /\.(png|svg|woff|woff2)$/,
            use: [{ loader: "file-loader" }],
          },
          {
            test: /\.css$/,
            use: [{ loader: "style-loader" }, { loader: "css-loader" }],
          },
        ],
      },
      plugins: [
        new CleanWebpackPlugin(),
        new WebpackBuildNotifierPlugin({
          title: "itch (renderer)",
        }),
        new HtmlWebpackPlugin({
          filename: "index.html",
          template: path.resolve(`./src/index.ejs`),
          minify: false,
        }),
        new NamedModulesPlugin(),
      ],
      devServer: {
        hot: true,
        host: "localhost",
        contentBase: __dirname,
      },
    }),
  ];
};

function getCommonConfig(type, env) {
  const isProduction = env.mode === "production";
  const mode = isProduction ? "production" : "development";

  return {
    mode,
    devtool: isProduction ? "source-map" : "eval",
    node: {
      __dirname: true,
      __filename: true,
    },
    output: {
      filename: "[name].bundle.js",
      chunkFilename: "[name].chunk.js",
      libraryTarget: "commonjs2",
      path: path.resolve(`./dist/${type}`),
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      plugins: [new TsconfigPathsPlugin({})],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: "/node_modules/",
          use: [{ loader: "happypack/loader?id=ts" }],
        },
      ],
    },
    plugins: [
      new HappyPack({
        id: "ts",
        threads: 4,
        loaders: [
          {
            path: "ts-loader",
            query: { happyPackMode: true },
          },
        ],
        verbose: false,
      }),
    ],
    optimization: {
      minimize: false,
      minimizer: [],
    },
  };
}
