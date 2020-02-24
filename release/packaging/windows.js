const $ = require("../common");
const fs = require("fs");
const ospath = require("path");
const { validateContext, toUnixPath } = require("./context");

module.exports = {
  sign: async function(cx, packageDir) {
    validateContext(cx);
    if (typeof packageDir !== "string"){
      throw new Error(`windows.sign: packageDir should be a string`);
    }
    if (!fs.existsSync(packageDir)){
      throw new Error(`windows.sign: packageDir should exist: (${packageDir})`);
    }

    const exePath = toUnixPath(ospath.join(packageDir, cx.binarySubdir, cx.binaryName));
    $.say(`Exe path (${exePath})`);
    if (!fs.existsSync(exePath)) {
      throw new Error(`windows.sign: exePath should exist: (${exePath})`);
    }

    // forward-slashes are doubled because of mingw, see http://www.mingw.org/wiki/Posix_path_conversion
    let signParams =
      '//v //s MY //n "itch corp." //fd sha256 //tr http://timestamp.comodoca.com/?td=sha256 //td sha256';
    let signtoolPath = "vendor/signtool.exe";

    $(await $.sh(`${signtoolPath} sign ${signParams} "${exePath}"`));
  },
};
