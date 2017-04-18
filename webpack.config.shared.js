
module.exports = {
  tslintRule: {
    enforce: "pre",
    test: /\.tsx?$/,
    loader: "tslint-loader",
    exclude: [
      /(node_modules)/,
      /_generated\./,
      /flatbuffers\.ts/,
    ],
  },
  imageRule: {
    test: /\.(jpe?g|png|gif|svg|woff2?|ttf|eot|svg|json)$/i,
    loaders: ["file-loader"]
  },
  sourceMapRule: {enforce: "pre", test: /\.js$/, loader: "source-map-loader"}
}
