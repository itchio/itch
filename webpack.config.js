const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");
const HappyPack = require("happypack");

const merge = require("webpack-merge");

module.exports = [
  merge.smart(getCommonConfig(), {
    target: "electron-main",
    entry: "./src/main/index.ts",
    output: {
      filename: "main.js"
    },
    externals: [
      "electron",
      "asfw",
    ],
  }),
  merge.smart(getCommonConfig(), {
    target: "electron-renderer",
    entry: "./src/renderer/index.tsx",
    output: {
      "filename": "renderer.js"
    },
    externals: [
      "electron",
      "systeminformation",
    ],
    module: {
      rules: [
        {
          test: /\.(png|svg|woff|woff2)$/,
          use: [
            {
              loader: "file-loader"
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            { loader: "style-loader" },
            { loader: "css-loader" },
          ]
        }
      ]
    }
  }),
];

function getCommonConfig () {
  return {
    mode: "development",
    devtool: "eval",
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      plugins: [
        new TsconfigPathsPlugin({})
      ],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: "/node_modules/",
          use: [
            {
              loader: "happypack/loader?id=ts",
            }
          ]
        },
      ]
    },
    plugins: [
      new HardSourceWebpackPlugin(),
      new HappyPack({
        id: "ts",
        threads: 4,
        loaders: [
          {
            path: "ts-loader",
            query: { happyPackMode: true }
          }
        ]
      }),
    ],
  }
}
