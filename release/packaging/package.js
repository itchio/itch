const $ = require("../common");
const ospath = require("path");
const fs = require("fs");
const { validateContext, toUnixPath } = require("./context");
const electronPackager = require("electron-packager");

module.exports.package = async function package(cx) {
  validateContext(cx);

  const { os, arch } = cx;
  $.say(`Packaging ${cx.appName} for ${os}-${arch}`);

  const appName = $.appName();
  const appVersion = $.buildVersion();
  const outDir = ospath.join("build", `v${appVersion}`);

  if (!fs.existsSync("prefix")) {
    throw new Error("Missing prefix/ folder, bailing out");
  }

  let electronOptions = {
    dir: "prefix",
    name: appName,
    electronVersion: cx.electronVersion,
    appVersion,
    asar: true,
    overwrite: true,
    out: outDir,
    ...getElectronOptions(cx),
    afterCopy: [
      async (buildPath, electronVersion, platform, arch, callback) => {
        await cleanModules(cx, buildPath);
        await installDeps(cx, buildPath);
        callback();
      },
    ],
  };

  const appPaths = await $.measure(
    "electron package",
    async () => await electronPackager(electronOptions)
  );
  let buildPath = toUnixPath(appPaths[0]);

  $.say(`Built app is in ${buildPath}`);

  $.say(`Moving to ${cx.packageDir}`);
  $(await $.sh(`rm -rf packages`));
  $(await $.sh(`mkdir -p packages`));

  // XXX: this used to be 'ditto' on macOS, not sure why
  $(await $.sh(`mv "${buildPath}" "${toUnixPath(cx.packageDir)}"`));

  if (os === "linux") {
    // see https://github.com/itchio/itch/issues/2121
    $.say(`Adding libgconf library...`);
    const debArch = arch === "386" ? "i386" : "amd64";
    const baseURL = `https://dl.itch.ovh/libgconf-2-4-bin`;
    const fileName = `libgconf-2.so.4`;
    const fileURL = `${baseURL}/${debArch}/${fileName}`;
    const dest = `${cx.packageDir}/${cx.binarySubdir}/${fileName}`;
    $.say(`Downloading (${fileURL})`);
    $.say(`  to (${dest})`);
    $(await $.sh(`curl -f -L ${fileURL} -o ${dest}`));
    $(await $.sh(`chmod +x ${dest}`));
  }
};

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

function windowsOptions(cx) {
  const options = {
    platform: "win32",
    icon: ospath.join(cx.iconsPath, "itch.ico"),
    win32metadata: {
      CompanyName: "itch corp.",
      LegalCopyright: "MIT license, (c) itch corp.",
      FileDescription: "the itch.io desktop app",
      OriginalFileName: `${cx.appName}.exe`,
      FileVersion: cx.appVersion,
      AppVersion: cx.appVersion,
      ProductName: cx.appName,
      InternalName: `${cx.appName}.exe`,
    },
  };
  return options;
}

function darwinOptions(cx) {
  const options = {
    platform: "darwin",
    arch: "x64",
    icon: ospath.join(cx.iconsPath, "itch.icns"),
    appBundleId: $.appBundleId(),
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
    if (!process.env.APPLE_ID_PASSWORD && os === "darwin") {
      throw new Error(
        `Code signing enabled, but $APPLE_ID_PASSWORD environment variable unset or empty`
      );
    }
  }
  return options;
}

async function cleanModules(cx, buildPath) {
  validateContext(cx);

  $.say("Cleaning modules...");
  await $.cd(buildPath, async function() {
    $(await $.sh("pwd"));
    $(await $.sh("ls -lhA"));
    await $.sh(
      `${toUnixPath(ospath.join(cx.projectDir, "release", "modclean.js"))} .`
    );
  });
}

async function installDeps(cx, buildPath) {
  validateContext(cx);

  // at this point, `buildPath` is `kitch-win32-x64/resources/app`
  const binaryDir = ospath.join(buildPath, "..", "..", cx.binarySubdir);

  $.say(`Downloading dependencies`);
  await $.cd(ospath.join(cx.projectDir, "install-deps"), async () => {
    $(await $.sh("go build"));
  });

  let installDepsPath = toUnixPath(
    ospath.join(cx.projectDir, "install-deps", "install-deps")
  );
  // TODO: change to --production once stable butler versions start being tagged again
  let args = `--manifest package.json --dir "${binaryDir}" --development`;
  $(await $.sh(`${installDepsPath} ${args}`));
}

async function sign(cx, buildPath) {
  validateContext(cx);

  // at this point, `buildPath` is `kitch-win32-x64/resources/app`
  const installDir = ospath.join(buildPath, "..", "..");
  $.say(`installDir is (${installDir})`);

  if (!cx.shouldSign) {
    $.say("Code signing disabled, skipping");
    return;
  }

  if (os === "windows") {
    $.say("Signing Windows executable...");
    const windows = require("./windows");
    await windows.sign(cx, installDir);
  } else if (os === "darwin") {
    $.say("Signing macOS app bundle...");
    const darwin = require("./darwin");
    await darwin.sign(cx, installDir);
  }
}
