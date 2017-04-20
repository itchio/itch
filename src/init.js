const path = require("path");
const appRoot = path.resolve(path.join(__dirname, ".."));
const cacheDir = path.join(appRoot, ".cache");
require("electron-compile-ftl").init(appRoot, require.resolve("./main"), false, ".cache");
