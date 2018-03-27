const $ = require("../common");

module.exports = {
  sign: async function(arch, buildPath) {
    let appBundle = `${buildPath}/${$.appName()}.app`;

    $.say("Signing Application bundle...");
    const signKey = "Developer ID Application: Amos Wenger (B2N6FSRTPV)";
    $(
      await $.sh(
        `codesign --deep --force --verbose --sign "${signKey}" ${appBundle}`
      )
    );
    $(await $.sh(`codesign --verify -vvvv ${appBundle}`));
    $(await $.sh(`spctl -a -vvvv ${appBundle}`));
  },
};
