
const nodeExternals = require("webpack-node-externals");
const {CheckerPlugin} = require("awesome-typescript-loader");
const {resolve} = require("path");

module.exports = {
    entry: [
        "react-hot-loader/patch",
        "./appsrc/chrome.tsx",
    ],
    output: {
        filename: "chrome.js",
        path: resolve(__dirname, "app"),
        libraryTarget: "commonjs2",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loaders: ["react-hot-loader/webpack", "awesome-typescript-loader"] },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ],
    },

    externals: nodeExternals(),

    plugins: [
        new CheckerPlugin(),
    ],

    target: "electron-renderer",

    devServer: {
        contentBase: resolve(__dirname, "app"),
    },
};
