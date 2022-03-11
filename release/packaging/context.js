//@ts-check
"use strict";

const { readFileSync } = require("fs");
const { OSES, ARCHES, getAppName, getBuildVersion } = require("../common");
const ospath = require("path");
const { chalk } = require("@itchio/bob");

/**
 * @typedef Context
 * @type {{
 *  appName: string,
 *  appVersion: string,
 *  os: string,
 *  arch: string,
 *  archInfo: {electronArch: "ia32" | "x64"},
 *  shouldSign: boolean,
 *  projectDir: string,
 *  artifactDir: string,
 *  binarySubdir: string,
 *  binaryName: string,
 *  iconsPath: string,
 *  electronVersion: string,
 *  testDev: boolean,
 * }}
 */

/**
 * @returns {Promise<Context>}
 */
async function parseContext() {
  let args = process.argv;
  let os = undefined;
  let arch = undefined;
  let testDev = false;
  let detectOSArch = false;

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg === "--os") {
      os = args[i + 1];
      i++;
    } else if (arg === "--arch") {
      arch = args[i + 1];
      i++;
    } else if (arg === "--detect-osarch") {
      detectOSArch = true;
    } else if (arg === "--test-dev") {
      testDev = true;
    }
  }

  if (detectOSArch) {
    if (!os) {
      os = "linux";
      if (process.platform === "win32") {
        os = "windows";
      } else if (process.platform === "darwin") {
        os = "darwin";
      }
    }

    if (!arch) {
      arch = "amd64";
    }
  }

  if (!os || !OSES[os]) {
    throw new Error(
      `Missing/wrong --os argument (should be one of ${Object.keys(OSES).join(
        ", "
      )}, was ${JSON.stringify(os)})`
    );
  }

  const archInfo = ARCHES[arch || ""];
  if (!arch || !archInfo) {
    throw new Error(
      `Missing/wrong --arch argument (should be one of ${Object.keys(
        ARCHES
      ).join(", ")}, was ${JSON.stringify(arch)})`
    );
  }

  // ok let's just add either mingw64 or mingw32 to the path if we're on 32-bit or 64-bit windows
  if (os === "windows") {
    if (arch === "386") {
      console.log("Adding mingw32 to PATH");
      process.env.PATH = `/mingw32/bin:${process.env.PATH}`;
    } else if (arch === "amd64") {
      console.log("Adding mingw64 to PATH");
      process.env.PATH = `/mingw64/bin:${process.env.PATH}`;
    }
  }

  const shouldSign = !!process.env.SKIP_CODESIGN ? false : !!process.env.CI || !!process.env.FORCE_CODESIGN;
  const projectDir = process.cwd();

  const artifactDir = ospath.join(projectDir, "artifacts", `${os}-${arch}`);

  let ext = os === "windows" ? ".exe" : "";
  let appName = getAppName();
  const binaryName = `${appName}${ext}`;
  const binarySubdir =
    os === "darwin" ? `./${appName}.app/Contents/MacOS` : ".";

  const iconsPath = ospath.join("release", "images", `${appName}-icons`);
  const electronVersion = JSON.parse(
    readFileSync("package.json", { encoding: "utf-8" })
  ).devDependencies.electron.replace(/^\^/, "");

  console.log(`| ${chalk.green(appName)} for ${chalk.green(os)}-${chalk.green(arch)}, Electron ${chalk.blue(electronVersion)}, code signing (${shouldSign ? chalk.green("enabled") : chalk.magenta("disabled")})`);

  return {
    appName,
    appVersion: getBuildVersion(),
    os,
    arch,
    archInfo,
    shouldSign,
    projectDir,
    artifactDir: artifactDir,
    binarySubdir,
    binaryName,
    iconsPath,
    electronVersion,
    testDev,
  };
}

/**
 * @param {string} s A (potentially) windows-style path
 * @returns {string} A windows-style path
 */
function toUnixPath(s) {
  if (process.platform === "win32") {
    return s.replace(/\\/g, "/");
  } else {
    return s;
  }
}

module.exports = {
  parseContext,
  toUnixPath,
};
