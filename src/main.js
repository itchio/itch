
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
