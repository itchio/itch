
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const {resolve} = require("path");

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

    // Enable sourcemaps for debugging webpack's output.
    devtool: "eval",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json", ".scss"],
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loaders: ["react-hot-loader/webpack", "ts-loader"]
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader"
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "resolve-url-loader"
                    },
                    {
                        loader: "sass-loader"
                    }
                ]
            },
            {
                test: /\.(jpe?g|png|gif|svg|woff2?|ttf|eot)$/i,
                loaders: [
                    "file-loader"
                ]
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            }
        ],
    },

    externals: [nodeExternals({
        whitelist: [/webpack/]
    })],

    plugins: [
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
    ],

    target: "electron-renderer",

    devServer: {
        port,
        hot: true,
        inline: false,
        historyApiFallback: true,
        contentBase: resolve(__dirname, "app"),
        publicPath,
    },
};
