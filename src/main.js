// const env = require("./env").default;
const env = {
  name: "development"
};

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

// if (env.name !== "test") {
//   require("./util/crash-reporter").mount();
// }

// if (env.name === "test") {
//   require("./boot/test-paths").setup();
// }

if (env.name === "development") {
  const fs = require("fs");
  require("source-map-support").install({
    retrieveSourceMap: function(source) {
      if (/metal.js$/.test(source)) {
        const map = fs.readFileSync('./dist/metal.map', 'utf8');
        return {
          url: 'metal.ts',
          map: map,
        };
      }
      return null;
    }
  });
}

function main() {
  if (runTests) {
    require("./unit-tests/run-unit-tests");
  } else {
    require("./metal");
  }
}

main();
