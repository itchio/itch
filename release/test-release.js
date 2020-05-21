//@ts-check
"use strict";

const { sh, say, chalk } = require("./common");

async function main() {
  say("Wiping build/");
  sh("rm -rf build/");
  say("Setting fake build tag...");
  process.env.CI_BUILD_TAG = "v9999.0.0";
  let os = "linux";
  if (process.platform === "win32") {
    os = "windows";
  } else if (process.platform === "darwin") {
    os = "darwin";
  }
  let arch = "amd64";
  say(`OS ${chalk.yellow(os)} Arch ${chalk.yellow(arch)})`);
  say("Building...");
  sh(`node release/ci-build.js --os ${os} --arch ${arch}`);
  sh(`node release/ci-package.js --os ${os} --arch ${arch}`);

  say("All done!");
}

main().catch((e) => {
  console.error("In main: ", e.stack);
});
