const $ = require("../common");
const { validateContext } = require("./context");
const ospath = require("path");

module.exports.test = async function test(cx) {
  validateContext(cx);

  await $.cd("integration-tests", async () => {
    $(await $.sh(`go build -o runner -v`));
  });
  process.env.ELECTRON_DISABLE_SANDBOX = "1";

  if (cx.testDev) {
    $.say("Will test development version");
    delete process.env.ITCH_INTEGRATION_BINARY_PATH;
    process.env.LOCAL_BUTLER = 1;
  } else {
    const binaryPath = ospath.join(cx.packageDir, cx.binarySubdir, cx.binaryName);
    $.say(`Will test production binary at (${binaryPath})`);
    process.env.ITCH_INTEGRATION_BINARY_PATH = binaryPath;
  }

  if (process.platform === "linux" && process.CI) {
    $.say("Running through xvfb");
    await $.sh(
      `xvfb-run -a -s "-screen 0 1280x720x24" ./integration-tests/runner`
    );
  } else {
    $(await $.sh(`./integration-tests/runner`));
  }
};
