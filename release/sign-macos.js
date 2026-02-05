//@ts-check

/**
 * Standalone macOS signing script for CI workflow.
 * Signs and notarizes pre-built macOS app bundles.
 *
 * Usage: node release/sign-macos.js --arch amd64|arm64
 *
 * Environment variables:
 *   APPLE_ID - Apple ID email for notarization
 *   APPLE_APP_SPECIFIC_PASSWORD - App-specific password for notarization
 *   APPLE_TEAM_ID - Apple Developer Team ID
 *   GITHUB_REF_TYPE - 'tag' or 'branch'
 *   GITHUB_REF_NAME - Tag or branch name
 */

import { readFileSync } from "fs";
import fs from "fs";
import ospath from "path";
import { getAppName, measure, hasTag, ARCHES } from "./common.js";

async function main() {
  const args = process.argv;
  let arch = undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--arch") {
      arch = args[i + 1];
      i++;
    }
  }

  if (!arch || !ARCHES[arch]) {
    throw new Error(
      `Missing/wrong --arch argument (should be one of ${Object.keys(ARCHES).join(", ")})`
    );
  }

  const appName = getAppName();
  const artifactDir = ospath.join(process.cwd(), "artifacts", `darwin-${arch}`);
  const appBundle = ospath.join(artifactDir, `${appName}.app`);

  console.log(`App name: ${appName}`);
  console.log(`Artifact dir: ${artifactDir}`);
  console.log(`App bundle: ${appBundle}`);

  if (!fs.existsSync(appBundle)) {
    throw new Error(`App bundle does not exist: ${appBundle}`);
  }

  const electronVersion = JSON.parse(
    readFileSync("package.json", { encoding: "utf-8" })
  ).devDependencies.electron.replace(/^\^/, "");

  console.log(`Electron version: ${electronVersion}`);

  // Sign the app
  await signApp(appBundle, electronVersion);

  // Notarize if this is a tag build
  await notarizeApp(appBundle);
}

/**
 * @param {string} appBundle
 * @param {string} electronVersion
 */
async function signApp(appBundle, electronVersion) {
  console.log("Preparing to sign Application bundle...");

  // Enable debug namespaces
  const namespaces = [
    "@electron/osx-sign",
    "electron-osx-sign",
    "electron-osx-sign:warn",
  ];
  process.env.DEBUG = namespaces.join(",");

  console.log("Writing entitlements file");
  const entitlementsPath = ospath.join(".", "entitlements.plist");
  fs.writeFileSync(entitlementsPath, entitlements());

  console.log("Signing Application bundle...");
  await measure("@electron/osx-sign", async () => {
    const debug = await import("debug");
    debug.default.enable("@electron/osx-sign");
    const { sign } = await import("@electron/osx-sign");
    await sign({
      app: appBundle,
      hardenedRuntime: true,
      entitlements: entitlementsPath,
      entitlementsInherit: entitlementsPath,
      gatekeeperAssess: false,
      platform: "darwin",
      version: electronVersion,
    });
  });

  console.log("Verifying signature...");
  const { $ } = await import("@itchio/bob");
  $(`codesign --verify -vvvv "${appBundle}"`);
}

/**
 * @param {string} appBundle
 */
async function notarizeApp(appBundle) {
  if (process.env.SKIP_NOTARIZE) {
    console.log(`$SKIP_NOTARIZE is set, skipping notarization...`);
    return;
  }

  if (!hasTag()) {
    console.log(`Not a tag build, skipping notarization...`);
    return;
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    throw new Error(
      "Missing required environment variables: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID"
    );
  }

  console.log("Notarizing...");
  await measure("@electron/notarize", async () => {
    const debug = await import("debug");
    debug.default.enable("@electron/notarize");
    const { notarize } = await import("@electron/notarize");
    await notarize({
      appPath: appBundle,
      appleId: appleId,
      appleIdPassword: appleIdPassword,
      teamId: teamId,
    });
  });

  console.log("Testing notarized requirement...");
  const { $ } = await import("@itchio/bob");
  $(`codesign --test-requirement="=notarized" -vvvv "${appBundle}"`);
}

function entitlements() {
  return `<?xml version="1.0" encoding="UTF-8"?>
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
