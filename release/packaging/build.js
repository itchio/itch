//@ts-check
"use strict";

const { readFileSync, writeFileSync } = require("fs");
const { $, cd } = require("@itchio/bob");
const { getAppName, getBuildVersion } = require("../common");

/**
 * @param {import("./context").Context} cx
 */
async function build(cx) {
  console.log(`Building ${getAppName()} ${getBuildVersion()}`);

  console.log("Wiping prefix/");
  $("rm -rf prefix");
  $("mkdir -p prefix");

  console.log("Compiling sources");
  $("npm run compile");

  console.log("Copying dist files to prefix/");
  $("cp -rf dist prefix/");

  console.log("Copying static resources to prefix...")
  $("mkdir prefix/src");
  $("cp -rf src/static prefix/src");

  console.log("Generating custom package.json");
  const pkg = JSON.parse(readFileSync("package.json", { encoding: "utf-8" }));
  for (const field of ["name", "productName", "desktopName"]) {
    pkg[field] = getAppName();
  }
  pkg.version = getBuildVersion();
  const pkgContents = JSON.stringify(pkg, null, 2);
  writeFileSync(`prefix/package.json`, pkgContents, { encoding: "utf-8" });

  console.log("Installing required externals");
  const externals = [
    "source-map-support", "systeminformation"
  ];
  await cd("prefix", async function () {
    $(`npm install --no-save ${externals.join(" ")}`);
  });
}

module.exports = { build };
