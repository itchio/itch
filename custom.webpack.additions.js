const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");

module.exports = {
  resolve: {
    plugins: [new TsconfigPathsPlugin({})],
  },
  plugins: [
    new HardSourceWebpackPlugin(),
  ],
};
