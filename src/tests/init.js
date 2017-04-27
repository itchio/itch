const path = require("path");
const appRoot = path.resolve(__dirname, "..", "..");
require("electron-compile").init(appRoot, require.resolve("./main"), false);

