const path = require("path");
const appRoot = path.join(__dirname, "..");
console.log("appRoot = ", appRoot);

require("electron-compile").init(appRoot, require.resolve("./main"), false, ".cache");
