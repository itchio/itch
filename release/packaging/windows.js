//@ts-check
"use strict";

const { $ } = require("@itchio/bob");
const fs = require("fs");
const ospath = require("path");
const { toUnixPath } = require("./context");

/**
 * @param {import("./context").Context} cx
 * @param {string} packageDir
 */
async function sign(cx, packageDir) {
  if (!fs.existsSync(packageDir)) {
    throw new Error(`windows.sign: packageDir should exist: (${packageDir})`);
  }

  const exePath = toUnixPath(
    ospath.join(packageDir, cx.binarySubdir, cx.binaryName)
  );
  console.log(`Exe path (${exePath})`);
  if (!fs.existsSync(exePath)) {
    throw new Error(`windows.sign: exePath should exist: (${exePath})`);
  }

  // forward-slashes are doubled because of mingw, see http://www.mingw.org/wiki/Posix_path_conversion
  let signParams =
    '//v //s MY //n "itch corp." //fd sha256 //tr http://timestamp.comodoca.com/?td=sha256 //td sha256 //a';
  let signtoolPath = "vendor/signtool.exe";

  $(`${signtoolPath} sign ${signParams} "${exePath}"`);
}

module.exports = { sign };

