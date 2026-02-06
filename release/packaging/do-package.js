//@ts-check

import { $, header } from "@itchio/bob";
import {
  measure,
  getAppName,
  getBuildVersion,
  appBundleId,
} from "../common.js";
import ospath from "path";
import fs from "fs";
import { toUnixPath } from "./context.js";
import { packager as electronPackager } from "@electron/packager";

/** @param {import("./context.js").Context} cx */
export async function doPackage(cx) {
  header("Packaging as a portable Electron application");

  const appName = getAppName();
  const appVersion = getBuildVersion();
  const outDir = ospath.join("build", `v${appVersion}`);

  if (!fs.existsSync("prefix")) {
    throw new Error("Missing prefix/ folder, bailing out");
  }

  /**
   * @type {import("@electron/packager").Options}
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
}

/**
 * @param {import("./context.js").Context} cx
 * @returns {Partial<import("@electron/packager").Options>}
 */
function getElectronOptions(cx) {
  if (cx.os === "windows") {
    return {
      ...windowsOptions(cx),
      arch: cx.archInfo.electronArch,
    };
  }
  if (cx.os === "darwin" && (cx.arch === "amd64" || cx.arch === "arm64")) {
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
 * @param {import("./context.js").Context} cx
 * @returns {Partial<import("@electron/packager").Options>}
 */
function windowsOptions(cx) {
  /**
   * @type {Partial<import("@electron/packager").Options>}
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
 * @param {import("./context.js").Context} cx
 * @returns {Partial<import("@electron/packager").Options>}
 */
function darwinOptions(cx) {
  /**
   * @type {Partial<import("@electron/packager").Options>}
   */
  const options = {
    platform: "darwin",
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

  return options;
}