//@ts-check
"use strict";

const { sh, say, cd } = require("../common");
const ospath = require("path");

/**
 * @param {import("./context").Context} cx
 */
async function test(cx) {
  await cd("integration-tests", async () => {
    sh(`go build -o runner -v`);
  });
  process.env.ELECTRON_DISABLE_SANDBOX = "1";

  if (cx.testDev) {
    say("Will test development version");
    delete process.env.ITCH_INTEGRATION_BINARY_PATH;
  } else {
    const binaryPath = ospath.join(
      cx.packageDir,
      cx.binarySubdir,
      cx.binaryName
    );
    say(`Will test production binary at (${binaryPath})`);
    process.env.ITCH_INTEGRATION_BINARY_PATH = binaryPath;
  }

  if (process.platform === "linux" && process.env.CI) {
    say("Running through xvfb");
    sh(`xvfb-run -a -s "-screen 0 1280x720x24" ./integration-tests/runner`);
  } else {
    say("Running normally - requires a running desktop environment");
    sh(`./integration-tests/runner`);
  }
}

module.exports = { test };
