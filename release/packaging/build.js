//@ts-check
"use strict";

const { readFileSync, writeFileSync } = require("fs");
const { $, cd, header } = require("@itchio/bob");
const { getAppName, getBuildVersion, measure } = require("../common");

/**
 * @param {import("./context").Context} cx
 */
async function build(cx) {
  header("Transpiling and bundling TypeScript, CSS, etc.");

  console.log("Wiping prefix/");
  $("rm -rf prefix");
  $("mkdir -p prefix");

  console.log("Compiling sources");
  await measure("webpack invocation", async () => {
    $("npm run compile");
  });

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
    // TODO: legacy-peer-deps is used here due to react-json-inspector having
    // dependencies set incorrectly locked to old version of react. In the future we should remove it
    // this flag was added for npm 7 support
    $(`npm install --no-save --legacy-peer-deps ${externals.join(" ")}`);
  });
}

module.exports = { build };
