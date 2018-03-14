const env = require("./env").default;

let runTests = false;
let thorough = true;

for (const arg of process.argv) {
  if (arg === "--run-unit-tests") {
    runTests = true;
  }
  if (arg === "--thorough") {
    thorough = true;
  }
  if (arg === "--shallow") {
    thorough = false;
  }
}

if (runTests) {
  process.env.ITCH_LOG_LEVEL = "error";
}

if (env.name !== "test") {
  require("./util/crash-reporter").mount();
}

if (env.name === "test") {
  require("./boot/test-paths").setup();
}

if (env.name === "development") {
  global.require = require;
  setInterval(function() {}, 400);

  global.wait = function(p) {
    p
      .then(res => console.log("Promise result: ", res))
      .catch(e => console.log("Promise rejected: ", e));
  };
}

function main() {
  if (runTests) {
    require("./unit-tests/run-unit-tests");
  } else {
    require("./metal");
  }
}

main();
