
if (process.env.ITCH_TIME_REQUIRE === "1") {
  require("time-require");
}

const path = require("path");
const appRoot = path.resolve(path.join(__dirname, ".."));
require("electron-compile-ftl").init(appRoot, require.resolve("./main"));
