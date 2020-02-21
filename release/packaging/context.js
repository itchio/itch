const $ = require("./common");
const ospath = require("path");

module.exports.parseContext = async function parseContext() {
  process.env.DEBUG =
    "electron-packager:*,electron-osx-sign:*,electron-notarize:*";

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

  if (!os || !$.OSES(os)) {
    throw new Error(
      `Missing/wrong --os argument (should be one of ${Object.keys(
        $.OSES
      )}, was ${JSON.stringify(os)})`
    );
  }
  const archInfo = $.ARCHES[arch];
  if (!arch || !archInfo) {
    throw new Error(
      `Missing/wrong --arch argument (should be one of ${Object.keys(
        $.ARCHES
      )}, was ${JSON.stringify(arch)})`
    );
  }

  const shouldSign = !!process.env.CI || !!process.env.FORCE_CODESIGN;
  const projectDir = process.cwd();

  const packageDir = ospath.join(projectDir, "packages", `${os}-${arch}`);

  const appName = $.appName();
  let ext = os === "windows" ? ".exe" : "";
  const binaryName = `${appName}${ext}`;
  const binarySubdir = ".";
  if (os === "darwin") {
    binarySubdir = "./Contents/MacOS";
  }

  const iconsPath = ospath.join("release", "images", `${appName}-icons`);
  const electronVersion = JSON.parse(
    await $.readFile("package.json")
  ).devDependencies.electron.replace(/^\^/, "");

  $.say(`============= Context info =============`);
  $.say(`App name: ${appName}`);
  $.say(`OS (${os}), Arch (${arch})`);
  $.say(`Electron version: ${electronVersion}`);
  $.say(`Code signing enabled: (${shouldSign})`);
  $.say(`Project dir: ${projectDir}`);
  $.say(`Package dir: ${packageDir}`);
  $.say(`Binary subPath: ${binarySubdir}`);
  $.say(`Binary name: ${binaryName}`);
  $.say(`========================================`);

  return {
    appName,
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
};

module.exports.validateContext = function validateContext(context) {
  if (!context) {
    throw new Error(`Missing context object`);
  }

  const fields = [
    "appName",
    "os",
    "arch",
    "archInfo",
    "shouldSign",
    "projectDir",
    "packageDir",
    "binarySubdir",
    "binaryName",
    "iconsPath",
    "electronVersion",
    "testDev",
  ];
  for (const field of fields) {
    if (typeof context[field] === "undefined") {
      throw new Error(`Missing '${field}' field from context`);
    }
  }
};
