//@ts-check
"use strict";

const { $, cd } = require("@itchio/bob");
const ospath = require("path");

/**
 * @param {import("./context").Context} cx
 */
async function test(cx) {
  await cd("integration-tests", async () => {
    $(`go build -o runner -v`);
  });
  process.env.ELECTRON_DISABLE_SANDBOX = "1";

  if (cx.testDev) {
    console.log("Will test development version");
    delete process.env.ITCH_INTEGRATION_BINARY_PATH;
  } else {
    const binaryPath = ospath.join(
      cx.artifactDir,
      cx.binarySubdir,
      cx.binaryName
    );
    console.log(`Will test production binary at (${binaryPath})`);
    process.env.ITCH_INTEGRATION_BINARY_PATH = binaryPath;
  }

  if (process.platform === "linux" && process.env.CI) {
    console.log("Running through xvfb");
    $(`xvfb-run -a -s "-screen 0 1280x720x24" ./integration-tests/runner`);
  } else {
    console.log("Running normally - requires a running desktop environment");
    $(`./integration-tests/runner`);
  }
}

module.exports = { test };

