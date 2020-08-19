//@ts-check
"use strict";

const { $, header } = require("@itchio/bob");
const {
  measure,
  getAppName,
  getBuildVersion,
  appBundleId,
} = require("../common");
const ospath = require("path");
const fs = require("fs");
const { toUnixPath } = require("./context");
const electronPackager = require("electron-packager");

/** @param {import("./context").Context} cx */
async function doPackage(cx) {
  header("Packaging as a portable Electron application");

  const appName = getAppName();
  const appVersion = getBuildVersion();
  const outDir = ospath.join("build", `v${appVersion}`);

  if (!fs.existsSync("prefix")) {
    throw new Error("Missing prefix/ folder, bailing out");
  }

  /**
   * @type {import("electron-packager").Options}
   */
  let electronOptions = {
    dir: "prefix",
    name: appName,
    electronVersion: cx.electronVersion,
    appVersion,
    buildVersion: appVersion,
    appCopyright: "MIT license, (c) itch corp.",
    asar: false,
    overwrite: true,
    out: outDir,
    ...getElectronOptions(cx),
  };

  const appPaths = await measure(
    "electron package",
    async () => await electronPackager(electronOptions)
  );
  let buildPath = toUnixPath(appPaths[0]);

  console.log(`Built app is in ${buildPath}`);

  console.log(`Moving to ${cx.artifactDir}`);
  $(`rm -rf "${toUnixPath(cx.artifactDir)}"`);
  $(`mkdir -p artifacts`);
  $(`mv "${buildPath}" "${toUnixPath(cx.artifactDir)}"`);

  await sign(cx);
}

/**
 * @param {import("./context").Context} cx
 * @returns {Partial<import("electron-packager").Options>}
 */
function getElectronOptions(cx) {
  if (cx.os === "windows") {
    return {
      ...windowsOptions(cx),
      arch: cx.archInfo.electronArch,
    };
  }
  if (cx.os === "darwin" && cx.arch === "amd64") {
    return {
      ...darwinOptions(cx),
      arch: cx.archInfo.electronArch,
    };
  }
  if (cx.os === "linux" && cx.arch === "amd64") {
    return {
      arch: cx.archInfo.electronArch,
    };
  }

  throw new Error(`Cannot build electron options for ${cx.os}-${cx.arch}`);
}

/**
 * @param {import("./context").Context} cx
 * @returns {Partial<import("electron-packager").Options>}
 */
function windowsOptions(cx) {
  /**
   * @type {Partial<import("electron-packager").Options>}
   */
  const options = {
    platform: "win32",
    icon: ospath.join(cx.iconsPath, "itch.ico"),
    win32metadata: {
      CompanyName: "itch corp.",
      FileDescription: "the itch.io desktop app",
      OriginalFilename: `${cx.appName}.exe`,
      ProductName: cx.appName,
      InternalName: `${cx.appName}.exe`,
    },
  };
  return options;
}

/**
 * @param {import("./context").Context} cx
 * @returns {Partial<import("electron-packager").Options>}
 */
function darwinOptions(cx) {
  /**
   * @type {Partial<import("electron-packager").Options>}
   */
  const options = {
    platform: "darwin",
    arch: "x64",
    icon: ospath.join(cx.iconsPath, "itch.icns"),
    appBundleId: appBundleId(),
    appCategoryType: "public.app-category.games",
    protocols: [
      {
        name: `${cx.appName}.io`,
        schemes: [`${cx.appName}io`],
      },
      {
        name: cx.appName,
        schemes: [cx.appName],
      },
    ],
  };

  if (cx.shouldSign) {
    if (!process.env.APPLE_ID_PASSWORD && cx.os === "darwin") {
      throw new Error(
        `Code signing enabled, but $APPLE_ID_PASSWORD environment variable unset or empty`
      );
    }
  }
  return options;
}

/**
 * @param {import("./context").Context} cx
 */
async function sign(cx) {
  const artifactDir = cx.artifactDir;
  console.log(`Artifact dir is (${artifactDir})`);

  if (!cx.shouldSign) {
    console.log("Code signing disabled, skipping");
    return;
  }

  if (cx.os === "windows") {
    console.log("Signing Windows executable...");
    const windows = require("./windows");
    await windows.sign(cx, artifactDir);
  } else if (cx.os === "darwin") {
    console.log("Signing macOS app bundle...");
    const darwin = require("./darwin");
    await darwin.sign(cx, artifactDir);
  } else {
    console.log("We don't sign Linux executables.");
  }
}

module.exports = { doPackage };
