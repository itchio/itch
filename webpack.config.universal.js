const { NamedModulesPlugin, DefinePlugin, BannerPlugin } = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const WebpackBuildNotifierPlugin = require("webpack-build-notifier");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const path = require("path");
const merge = require("webpack-merge");

module.exports = env => {
  const isProduction = env.mode === "production";

  return [
    merge.smart(getCommonConfig("main", env), {
      target: "electron-main",
      resolve: {
        mainFields: ["electron-main", "module", "main"],
      },
      output: {
        libraryTarget: "commonjs2",
      },
      node: {
        __dirname: false,
        __filename: false,
      },
      entry: {
        main: ["./src/main/index.ts"],
      },
      plugins: [
        new CleanWebpackPlugin(),
        new DefinePlugin({
          // yes, the "main process" in electron is called "browser"
          "process.type": JSON.stringify("browser"),
        }),
        new BannerPlugin({
          banner: `require("source-map-support").install()`,
          raw: true,
        }),
        new WebpackBuildNotifierPlugin({
          title: "itch (main)",
        }),
      ],
    }),
    merge.smart(getCommonConfig("renderer", env), {
      target: "web",
      resolve: {
        mainFields: ["browser", "module", "main"],
        alias: {
          ...(isProduction ? {} : {"react-dom": "@hot-loader/react-dom"}),
        },
      },
      output: {
        filename: "[name].[hash].bundle.js",
        chunkFilename: "[name].[contenthash].chunk.js",
        publicPath: "itch://app/assets/",
        crossOriginLoading: "anonymous",
      },
      entry: {
        renderer: ["react-hot-loader/patch", "./src/renderer/index.tsx"],
      },
      module: {
        rules: [
          {
            test: /\.css$/,
            use: [{ loader: "style-loader" }, { loader: "css-loader" }],
          },
        ],
      },
      plugins: [
        new CleanWebpackPlugin(),
        new DefinePlugin({
          "process.type": JSON.stringify("renderer"),
        }),
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
        contentBase: __dirname,
        disableHostCheck: true,
        publicPath: "/assets/",
      },
    }),
  ];
};

function getCommonConfig(type, env) {
  const isProduction = env.mode === "production";
  const mode = isProduction ? "production" : "development";
  let plugins = [];

  return {
    mode,
    // N.B.: anything else is broken, so, don't bother
    // also, yes, we need the separate entry point to install source map support
    devtool: isProduction ? undefined : "cheap-module-eval-source-map",
    output: {
      filename: "[name].bundle.js",
      chunkFilename: "[name].chunk.js",
      path: path.resolve(`./dist/${mode}/${type}/assets`),
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
      modules: ["node_modules"],
      plugins: [new TsconfigPathsPlugin({})],
    },
    externals: ["child_process", "net", "ws", "electron-devtools-installer"],
    module: {
      rules: [
        {
          test: /\.(png|svg|woff|woff2)$/,
          use: [{ loader: "file-loader" }],
        },
        {
          test: /\.(j|t)s(x)?$/,
          loader: "babel-loader",
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: [
              "@babel/react",
              "@babel/typescript",
              [
                "@babel/env",
                {
                  targets: {
                    electron: "7.1.2",
                  },
                },
              ],
            ],
            plugins: [
              "@babel/proposal-class-properties",
              "@babel/proposal-object-rest-spread",
              "@babel/plugin-proposal-optional-chaining",
              "@babel/plugin-proposal-nullish-coalescing-operator",
              ...(isProduction ? [] : ["react-hot-loader/babel"]),
              [
                "babel-plugin-styled-components",
                {
                  displayName: !isProduction,
                  pure: isProduction,
                  minify: isProduction,
                  transpileTemplateLiterals: isProduction,
                },
              ],
            ],
          },
        },
        {
          test: "/.js$/",
          use: ["source-map-loader"],
          enforce: "pre",
        },
      ],
    },
    optimization: {
      // N.B: minifiers break production code all the dang time, resist the urge
      // to enable them.
      minimize: isProduction,
    },
    plugins,
  };
}
