//@ts-check

import { $ } from "@itchio/bob";
import { hasTag, measure, appBundleId } from "../common.js";
import fs from "fs";
import ospath from "path";

/**
 * @param {import("./context.js").Context} cx
 * @param {string} packageDir
 */
export async function sign(cx, packageDir) {
  console.log("Preparing to sign Application bundle...");

  // enable debug namespaces
  const namespaces = [
    "electron-osx-sign",
    "electron-osx-sign:warn",
    "electron-notarize:spawn",
    "electron-notarize:helpers",
  ];
  process.env.DEBUG = namespaces.join(",");

  let appBundle = ospath.join(packageDir, `${cx.appName}.app`);
  console.log(`App bundle path (${appBundle})`);
  if (!fs.existsSync(appBundle)) {
    throw new Error(`App bundle should exist: ${appBundle}`);
  }

  console.log("Writing entitlements file");
  const entitlementsPath = ospath.join(".", "entitlements.plist");
  fs.writeFileSync(entitlementsPath, entitlements());

  console.log("Signing Application bundle...");
  await measure("electron-osx-sign", async () => {
    const debug = await import("debug");
    debug.default.enable("electron-osx-sign");
    const electronOsxSign = await import("electron-osx-sign");
    await electronOsxSign.signAsync({
      app: appBundle,
      hardenedRuntime: true,
      entitlements: entitlementsPath,
      "entitlements-inherit": entitlementsPath,
      "gatekeeper-assess": false,
      platform: "darwin",
      version: cx.electronVersion,
    });
  });

  console.log("Verifying signature...");
  $(`codesign --verify -vvvv ${appBundle}`);
  // $(`spctl -a -vvvv ${appBundle}`); // on modern osx this will also verify notarization, so we can't use this to check signature anymore

  if (process.env.SKIP_NOTARIZE) {
    console.log(`$SKIP_NOTARIZE is set, skipping notarization...`);
  } else if (!hasTag()) {
    console.log(`Doesn't have tag set, skipping notarization...`);
  } else {
    console.log("Notarizing...");
    await measure("electron-notarize", async () => {
      const debug = await import("debug");
      debug.default.enable("@electron/notarize");
      const { notarize } = await import("@electron/notarize");
      await notarize({
        appBundleId: appBundleId(),
        appPath: appBundle,
        appleId: "leafot@gmail.com",
        appleIdPassword: process.env.APPLE_ID_PASSWORD || "",
        teamId: process.env.APPLE_TEAM_ID || "",
      });
    });

    console.log("Testing notarized requirement...");
    $(`codesign --test-requirement="=notarized" -vvvv ${appBundle}`);
  }
}

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
