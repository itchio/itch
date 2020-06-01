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
  $("cp electron-index.js prefix/");
  $("mkdir -p prefix/dist");
  $("cp -rf dist/production prefix/dist/");

  console.log("Generating custom package.json");
  const pkg = JSON.parse(readFileSync("package.json", { encoding: "utf-8" }));
  for (const field of ["name", "productName", "desktopName"]) {
    pkg[field] = getAppName();
  }
  pkg.version = getBuildVersion();
  const pkgContents = JSON.stringify(pkg, null, 2);
  writeFileSync(`prefix/package.json`, pkgContents, { encoding: "utf-8" });

  console.log("Downloading valet binaries");
  let valetArch = cx.archInfo.electronArch === "ia32" ? "i686" : "x86_64";
  let otherValetArch = valetArch == "i686" ? "x86_64" : "i686";
  await cd("node_modules/@itchio/valet", async function () {
    $(`npm run postinstall -- --verbose --arch ${valetArch}`);
  });

  console.log("Copying valet to prefix");
  $("mkdir -p prefix/node_modules/@itchio");
  $("cp -rf node_modules/@itchio/valet prefix/node_modules/@itchio");
  console.log("Trimming down valet install");
  $(`rm -rf prefix/node_modules/@itchio/valet/artifacts/${otherValetArch}-*`);

  console.log("Installing required externals");
  const externals = [
    // TODO: is it really a good idea to ship that in production?
    "source-map-support",
  ];
  await cd("prefix", async function () {
    $(`npm install --no-save ${externals.join(" ")}`);
  });
}

module.exports = { build };
