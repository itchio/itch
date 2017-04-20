const path = require("path");
const appRoot = path.join(__dirname, "..");
require("electron-compile-ftl").init(appRoot, require.resolve("./main"), false, ".cache");
