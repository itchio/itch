const { NamedModulesPlugin } = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const WebpackBuildNotifierPlugin = require("webpack-build-notifier");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const path = require("path");
const merge = require("webpack-merge");

module.exports = env => {
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
        __dirname: true,
        __filename: true,
      },
      entry: {
        main: [
          "react-hot-loader/patch",
          "./src/main/entry.ts",
          "./src/main/index.ts",
        ],
      },
      plugins: [
        new CleanWebpackPlugin(),
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
          "react-dom": "@hot-loader/react-dom",
        },
      },
      entry: {
        renderer: ["./src/renderer/index.tsx"],
      },
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
  if (!isProduction) {
    plugins.push(new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true }));
  }

  return {
    mode,
    // N.B.: anything else is broken, so, don't bother
    // also, yes, we need the separate entry point to install source map support
    devtool: "source-map",
    output: {
      filename: "[name].bundle.js",
      chunkFilename: "[name].chunk.js",
      path: path.resolve(`./dist/${mode}/${type}/assets`),
      publicPath: "itch://app/assets/",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      plugins: [new TsconfigPathsPlugin({})],
    },
    externals: ["child_process", "net", "ws"],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: "/node_modules/",
          use: [
            { loader: "cache-loader" },
            { loader: "thread-loader" },
            { loader: "ts-loader", options: { happyPackMode: true } },
          ],
        },
      ],
    },
    optimization: {
      // N.B: minifiers break production code all the dang time, resist the urge
      // to enable them.
      minimize: false,
      minimizer: [],
    },
    plugins,
  };
}
