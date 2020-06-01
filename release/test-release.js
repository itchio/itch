//@ts-check
"use strict";

const { $, chalk } = require("@itchio/bob");

async function main() {
  console.log("Wiping build/");
  $("rm -rf build/");
  let os = "linux";
  if (process.platform === "win32") {
    os = "windows";
  } else if (process.platform === "darwin") {
    os = "darwin";
  }
  let arch = "amd64";
  console.log(`OS ${chalk.yellow(os)} arch ${chalk.yellow(arch)}`);
  console.log("Building...");
  $(`node release/build.js --os ${os} --arch ${arch}`);
  $(`node release/package.js --os ${os} --arch ${arch}`);

  console.log("All done!");
}

main().catch((e) => {
  console.error("In main: ", e.stack);
});
