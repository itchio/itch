//@ts-check
"use strict";

const {
  OSES,
  ARCHES,
  say,
  readFile,
  getAppName,
  getBuildVersion,
} = require("../common");
const ospath = require("path");

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
 *  packageDir: string,
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

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg === "--os") {
      os = args[i + 1];
      i++;
    } else if (arg === "--arch") {
      arch = args[i + 1];
      i++;
    } else if (arg === "--test-dev") {
      testDev = true;
    }
  }

  if (!os || !OSES[os]) {
    throw new Error(
      `Missing/wrong --os argument (should be one of ${Object.keys(
        OSES
      )}, was ${JSON.stringify(os)})`
    );
  }

  const archInfo = ARCHES[arch || ""];
  if (!arch || !archInfo) {
    throw new Error(
      `Missing/wrong --arch argument (should be one of ${Object.keys(
        ARCHES
      )}, was ${JSON.stringify(arch)})`
    );
  }

  // ok let's just add either mingw64 or mingw32 to the path if we're on 32-bit or 64-bit windows
  if (os === "windows") {
    if (arch === "386") {
      say("Adding mingw32 to PATH");
      process.env.PATH = `/mingw32/bin:${process.env.PATH}`;
    } else if (arch === "amd64") {
      say("Adding mingw64 to PATH");
      process.env.PATH = `/mingw64/bin:${process.env.PATH}`;
    }
  }

  const shouldSign = !!process.env.CI || !!process.env.FORCE_CODESIGN;
  const projectDir = process.cwd();

  const packageDir = ospath.join(projectDir, "packages", `${os}-${arch}`);

  let ext = os === "windows" ? ".exe" : "";
  let appName = getAppName();
  const binaryName = `${appName}${ext}`;
  const binarySubdir =
    os === "darwin" ? `./${appName}.app/Contents/MacOS` : ".";

  const iconsPath = ospath.join("release", "images", `${appName}-icons`);
  const electronVersion = JSON.parse(
    await readFile("package.json")
  ).devDependencies.electron.replace(/^\^/, "");

  say(`============= Context info =============`);
  say(`App name (${appName})`);
  say(`OS (${os}), Arch (${arch})`);
  say(`Electron version (${electronVersion})`);
  say(`Code signing enabled: (${shouldSign})`);
  say(`Project dir (${projectDir})`);
  say(`Package dir (${packageDir})`);
  say(`Binary subPath (${binarySubdir})`);
  say(`Binary name (${binaryName})`);
  say(`========================================`);

  return {
    appName,
    appVersion: getBuildVersion(),
    os,
    arch,
    archInfo,
    shouldSign,
    projectDir,
    packageDir,
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
