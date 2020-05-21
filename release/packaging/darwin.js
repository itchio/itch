//@ts-check
"use strict";

const { hasTag, say, sh, measure, appBundleId } = require("../common");
const fs = require("fs");
const ospath = require("path");

/**
 * @param {import("./context").Context} cx
 * @param {string} packageDir
 */
async function sign(cx, packageDir) {
  say("Preparing to sign Application bundle...");

  // enable debug namespaces
  const namespaces = [
    "electron-osx-sign",
    "electron-osx-sign:warn",
    "electron-notarize:spawn",
    "electron-notarize:helpers",
  ];
  process.env.DEBUG = namespaces.join(",");

  let appBundle = ospath.join(packageDir, `${cx.appName}.app`);
  say(`App bundle path (${appBundle})`);
  if (!fs.existsSync(appBundle)) {
    throw new Error(`App bundle should exist: ${appBundle}`);
  }

  say("Writing entitlements file");
  const entitlementsPath = ospath.join(".", "entitlements.plist");
  fs.writeFileSync(entitlementsPath, entitlements());

  say("Signing Application bundle...");
  await measure("electron-osx-sign", async () => {
    require("debug").enable("electron-osx-sign");
    const sign = require("electron-osx-sign").signAsync;
    await sign({
      app: appBundle,
      hardenedRuntime: true,
      entitlements: entitlementsPath,
      "entitlements-inherit": entitlementsPath,
      platform: "darwin",
      version: cx.electronVersion,
    });
  });

  say("Verifying signature...");
  sh(`codesign --verify -vvvv ${appBundle}`);
  sh(`spctl -a -vvvv ${appBundle}`);

  if (process.env.SKIP_NOTARIZE) {
    say(`$SKIP_NOTARIZE is set, skipping notarization...`);
  } else if (!hasTag()) {
    say(`Doesn't have tag set, skipping notarization...`);
  } else {
    say("Notarizing...");
    await measure("electron-notarize", async () => {
      require("debug").enable("electron-notarize");
      const { notarize } = require("electron-notarize");
      await notarize({
        appBundleId: appBundleId(),
        appPath: appBundle,
        appleId: "amoswenger@gmail.com",
        appleIdPassword: process.env.APPLE_ID_PASSWORD || "",
      });
    });

    say("Testing notarized requirement...");
    sh(`codesign --test-requirement="=notarized" -vvvv ${appBundle}`);
  }
}

module.exports = {
  sign,
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
