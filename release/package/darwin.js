const $ = require("../common");

module.exports = {
  sign: async function(arch, buildPath) {
    let appBundle = `${buildPath}/${$.appName()}.app`;

    $.say("Signing Application bundle...");
    const signKey = "Developer ID Application: Amos Wenger (B2N6FSRTPV)";
    $(
      await $.sh(
        `codesign --deep --force --verbose --timestamp --sign "${signKey}" ${appBundle}`
      )
    );

    $.say("Verifying signature...");
    $(await $.sh(`codesign --verify -vvvv ${appBundle}`));
    $(await $.sh(`spctl -a -vvvv ${appBundle}`));

    $.say("Notarizing...");
    await $.measure("electron-notarize", async () => {
      const { notarize } = require("electron-notarize");
      await notarize({
        appBundleId: $.appBundleId(),
        appPath: appBundle,
        appleId: "amoswenger@gmail.com",
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
      });
    })

    $.say("Testing notarized requirement...");
    $(await $.sh(`codesign --test-requirement="=notarized" -vvvv ${appBundle}`));
  },
};
