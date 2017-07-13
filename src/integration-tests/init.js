const path = require("path");
const appRoot = path.resolve(path.join(__dirname, "..", ".."));
require("electron-compile-ftl").init(appRoot, require.resolve("./main.ts"));