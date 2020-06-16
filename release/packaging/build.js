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

  console.log("Copying lib files to prefix/");
  $("cp electron-index.js prefix/");
  $("mkdir -p prefix/lib");
  $("cp -rf lib/production prefix/lib/");

  console.log("Generating custom package.json");
  const pkg = JSON.parse(readFileSync("package.json", { encoding: "utf-8" }));
  for (const field of ["name", "productName", "desktopName"]) {
    pkg[field] = getAppName();
  }
  pkg.version = getBuildVersion();
  const pkgContents = JSON.stringify(pkg, null, 2);
  writeFileSync(`prefix/package.json`, pkgContents, { encoding: "utf-8" });

  console.log("Copying package-lock.json");
  $("cp package-lock.json prefix/");

  process.env.VALET_TARGET_OS = cx.os;
  process.env.VALET_TARGET_ARCH = cx.arch === "386" ? "i686" : "x86_64";
  await cd("prefix", async function () {
    $(`npm ci --production --no-audit`);
  });
}

module.exports = { build };
