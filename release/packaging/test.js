const $ = require("../common");
const validateContext = require("./context");
const ospath = require("ospath");

module.exports.test = async function test(cx) {
  validateContext(cx);

  // TODO: test the just-built binary

  let binName = `itch-integration-tests`;
  await $.cd("integration-tests", async () => {
    $(await $.sh(`go build -o runner -v`));
  });
  process.env.ELECTRON_DISABLE_SANDBOX = "1";

  if (cx.testDev) {
    $.say("Will test development version");
    delete process.env.ITCH_INTEGRATION_BINARY_PATH;
  } else {
    const binaryPath = ospath.join(cx.packageDir, binarySubdir);
    $.say("Will test production version");
    delete process.env.ITCH_INTEGRATION_BINARY_PATH;
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
