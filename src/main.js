
const env = require("./env").default;

let runTests = false;
let thorough = false;

for (const arg of process.argv) {
    if (arg === "--run-unit-tests") {
        runTests = true;
    }
    if (arg === "--thorough") {
        thorough = true;
    }
}

let quickTests = (runTests && !thorough);
let beFast = (env.name === "production") || quickTests;

if (!beFast) {
    console.log("Enabling slow but detailed stack traces");
    require("bluebird").config(
        {
            longStackTraces: true,
            warnings: true,
        }
    );

    require("source-map-support").install({
        hookRequire: true,
    });
}

// monkey-patch a few things
require("./os/sf");

if (env.name === "production") {
    require("./util/crash-reporter").mount();
}

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

function main() {
    if (runTests) {
        require("./unit-tests/run-unit-tests");
    } else {
        require("./metal");
    }
}

main();
