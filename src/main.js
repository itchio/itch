
const env = require("./env").default;

if (env.name === "test") {
  require("./boot/test-paths").setup();
}

if (env.name === "development") {
  global.require = require;
  setInterval(function () { }, 400);

  global.wait = function (p) {
    p
      .then((res) => console.log("Promise result: ", res))
      .catch((e) => console.log("Promise rejected: ", e))
  }
}

require("./boot/crash");
require("./boot/sourcemaps");
require("./boot/bluebird");
require("./boot/fs");

function main() {
  for (const arg of process.argv) {
    if (arg === "--run-unit-tests") {
      require("./unit-tests/run-unit-tests");
      return;
    }
  }

  require("./metal");
}

main();
