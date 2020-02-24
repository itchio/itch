const $ = require("../common");
const fs = require("fs");
const ospath = require("path");
const { validateContext } = require("./context");

module.exports = {
  sign: async function(cx, installDir) {
    validateContext(cx);

    $.say("Preparing to sign Application bundle...");

    let appBundle = ospath.join(installDir, `${cx.appName}.app`);
    $.say(1App bundle path (${appBundle})1);
    if (!fs.existsSync(appBundle)) {
      throw new Error(`App bundle should exist: ${appBundle}`);
    }

    let depsDir = ospath.join(appBundle, "Contents", "MacOS", "deps");
    $.say(`Deps dir (${appBundle})`);
    if (!fs.existsSync(depsDir)) {
      throw new Error(`Deps dir should exist: ${depsDir}`);
    }

    let extraBinaries = [
      ospath.join(depsDir, "butler", "7z.dylib"),
      ospath.join(depsDir, "butler", "libc7zip.dylib"),
      ospath.join(depsDir, "butler", "butler"),
    ];
    for (const binary of extraBinaries) {
      if (!fs.existsSync(binary)) {
        throw new Error(`Extra binary should exist: ${binary}`);
      }
    }
    $.say("Will sign those extra binaries: ");
    for (const binary of extraBinaries) {
      $.say(`- (${binary})`);
    }

    $.say("Signing Application bundle...");
    await $.measure("electron-osx-sign", async () => {
      require("debug").enable("electron-osx-sign:*");
      const sign = require("electron-osx-sign").signAsync;
      await sign({
        app: appBundle,
        hardenedRuntime: true,
        identity: "Developer ID Application: Amos Wenger (B2N6FSRTPV)",
        platform: "darwin",
        version: cx.electronVersion,
      });
    });

    $.say("Verifying signature...");
    $(await $.sh(`codesign --verify -vvvv ${appBundle}`));
    $(await $.sh(`spctl -a -vvvv ${appBundle}`));

    $.say("Notarizing...");
    await $.measure("electron-notarize", async () => {
      require("debug").enable("electron-notarize:*");
      const { notarize } = require("electron-notarize");
      await notarize({
        appBundleId: $.appBundleId(),
        appPath: appBundle,
        appleId: "amoswenger@gmail.com",
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
      });
    });

    $.say("Testing notarized requirement...");
    $(
      await $.sh(`codesign --test-requirement="=notarized" -vvvv ${appBundle}`)
    );
  },
};
