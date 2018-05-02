#!/usr/bin/env node

const $ = require("./common");

async function main() {
  $.say("Wiping build/");
  $(await $.sh("rm -rf build/"));
  $.say("Setting fake build tag...");
  process.env.CI_BUILD_TAG = "v9999.0.0";
  $.say("Building...");
  $(await $.sh("node release/ci-compile.js"));
  let os = "linux";
  if (process.platform === "win32") {
    os = "windows";
  } else if (process.platform === "darwin") {
    os = "darwin";
  }
  let arch = "amd64";
  $(await $.sh(`node release/ci-package.js ${os} ${arch}`));

  $.say("All done!");
}

main().catch(e => {
  console.error("In main: ", e.stack);
});
