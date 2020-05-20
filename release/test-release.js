//@ts-check
"use strict";

const { sh, say } = require("./common");

async function main() {
  say("Wiping build/");
  sh("rm -rf build/");
  say("Setting fake build tag...");
  process.env.CI_BUILD_TAG = "v9999.0.0";
  say("Building...");
  sh("node release/ci-compile.js");
  let os = "linux";
  if (process.platform === "win32") {
    os = "windows";
  } else if (process.platform === "darwin") {
    os = "darwin";
  }
  let arch = "amd64";
  sh(`node release/ci-package.js ${os} ${arch}`);

  say("All done!");
}

main().catch((e) => {
  console.error("In main: ", e.stack);
});
