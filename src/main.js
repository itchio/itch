
require("./boot/crash");
require("./boot/sourcemaps");
require("./boot/bluebird");
require("./boot/fs");

function main () {
  for (const arg of process.argv) {
    if (arg === "--run-unit-tests") {
      require("./tests/run-unit-tests");
      return;
    }
  }

  require("./metal");
}

main();
