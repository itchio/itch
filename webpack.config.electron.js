
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const {resolve} = require("path");

module.exports = {
    entry: [
        "./appsrc/metal.ts",
    ],
    output: {
        path: resolve(__dirname, "app"),
        filename: "metal.js",
        libraryTarget: "commonjs2",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "inline-source-map",

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            { test: /\.tsx?$/, loaders: ["ts-loader"] },
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" },
        ],
    },

    externals: [nodeExternals()],

    plugins: [
        new webpack.NamedModulesPlugin(),
    ],

    target: "electron-main",

    /**
     * Disables webpack processing of __dirname and __filename.
     * If you run the bundle in node.js it falls back to these values of node.js.
     * https://github.com/webpack/webpack/issues/2010
     */
    node: {
        __dirname: false,
        __filename: false,
    },
};
