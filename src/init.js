
require("bluebird").config({
  longStackTraces: true,
  warnings: true,
});
require("source-map-support").install({
  hookRequire: true,
});

const path = require("path");
const appRoot = path.resolve(path.join(__dirname, ".."));
require("electron-compile").init(appRoot, require.resolve("./main"));
