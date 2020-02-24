const $ = require("../common");
const fs = require("fs");
const ospath = require("path");
const { validateContext, toUnixPath } = require("./context");

module.exports = {
  sign: async function(cx, installDir) {
    validateContext(cx);
    if (typeof installDir !== "string"){
      throw new Error(`windows.sign: installDir should be a string`);
    }
    if (!fs.existsSync(installDir)){
      throw new Error(`windows.sign: installDir should exist: (${installDir})`);
    }

    const exePath = toUnixPath(ospath.join(installDir, cx.binarySubdir, cx.binaryName));

    // forward-slashes are doubled because of mingw, see http://www.mingw.org/wiki/Posix_path_conversion
    let signParams =
      '//v //s MY //n "itch corp." //fd sha256 //tr http://timestamp.comodoca.com/?td=sha256 //td sha256';
    let signtoolPath = "vendor/signtool.exe";

    $(await $.sh(`${signtoolPath} sign ${signParams} "${exePath}"`));
  },
};
