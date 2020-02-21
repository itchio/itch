const $ = require("../common");
const { validateContext } = require("./context");
const { join } = require("path").posix;

module.exports = {
  sign: async function(cx) {
    validateContext(cx);

    const exePath = join(cx.packageDir, cx.binarySubdir, cx.binaryName);
    // see package function
    // forward-slashes are doubled because of mingw, see http://www.mingw.org/wiki/Posix_path_conversion
    let signParams =
      '//v //s MY //n "itch corp." //fd sha256 //tr http://timestamp.comodoca.com/?td=sha256 //td sha256';
    let signtoolPath = "vendor/signtool.exe";

    $(await $.sh(`${signtoolPath} sign ${signParams} ${exePath}`));
  },
};
