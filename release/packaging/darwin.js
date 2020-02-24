const $ = require("../common");
const fs = require("fs");
const ospath = require("path");
const { validateContext } = require("./context");

module.exports = {
  sign: async function(cx, packageDir) {
    validateContext(cx);

    $.say("Preparing to sign Application bundle...");

    // enable debug namespaces
    const namespaces = [
      "electron-osx-sign",
      "electron-osx-sign:warn",
      "electron-notarize:spawn",
      "electron-notarize:helpers",
    ];
    process.env.DEBUG = namespaces.join(",");

    let appBundle = ospath.join(packageDir, `${cx.appName}.app`);
    $.say(`App bundle path (${appBundle})`);
    if (!fs.existsSync(appBundle)) {
      throw new Error(`App bundle should exist: ${appBundle}`);
    }

    let depsDir = ospath.join(appBundle, "Contents", "MacOS", "deps");
    $.say(`Deps dir (${depsDir})`);
    if (!fs.existsSync(depsDir)) {
      throw new Error(`Deps dir should exist: ${depsDir}`);
    }

    let extraBinaries = [
      ospath.join(depsDir, "butler", "7z.so"),
      ospath.join(depsDir, "butler", "libc7zip.dylib"),
      ospath.join(depsDir, "butler", "butler"),
    ];
    for (const binary of extraBinaries) {
      if (!fs.existsSync(binary)) {
        throw new Error(`Extra binary should exist: ${binary}`);
      }
    }
    $.say("Signing extra binaries...");
    const identity = "Developer ID Application: Amos Wenger (B2N6FSRTPV)";
    for (const binary of extraBinaries) {
      $.say(`Signing (${binary})`);
      $(await $.sh(`codesign --sign "${identity}" --force --timestamp --options runtime "${binary}"`));
    }

    $.say("Writing entitlements file");
    const entitlementsPath = ospath.join(".", "entitlements.plist");
    fs.writeFileSync(entitlementsPath, entitlements());

    $.say("Signing Application bundle...");
    await $.measure("electron-osx-sign", async () => {
      require("debug").enable("electron-osx-sign");
      const sign = require("electron-osx-sign").signAsync;
      await sign({
        app: appBundle,
        hardenedRuntime: true,
        identity,
        entitlements: entitlementsPath,
        "entitlements-inherit": entitlementsPath,
        platform: "darwin",
        version: cx.electronVersion,
      });
    });

    $.say("Verifying signature...");
    $(await $.sh(`codesign --verify -vvvv ${appBundle}`));
    $(await $.sh(`spctl -a -vvvv ${appBundle}`));

    if (process.env.SKIP_NOTARIZE) {
      $.say(`$SKIP_NOTARIZE is set, skipping notarization...`);
    } else {
      $.say("Notarizing...");
      await $.measure("electron-notarize", async () => {
        require("debug").enable("electron-notarize");
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
    }
  },
};

function entitlements() {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
  </dict>
</plist>
`;
}
