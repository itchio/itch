#!/usr/bin/env node

// generate itch package for various platforms

const ospath = require("path");
const $ = require("./common");
const { compile } = require("./package/compile");

async function ciPackage(args) {
  if (args.length !== 2) {
    const got = args.join(" ::: ");
    const msg = `ci-package expects two arguments, got ${got}`;
    throw new Error(msg);
  }
  const [os, arch] = args;

  if (!$.OSES[os]) {
    const msg = `invalid os ${os}, must be in ${Object.keys($.OSES).join(
      " ::: "
    )}`;
    throw new Error(msg);
  }

  const archInfo = $.ARCHES[arch];
  if (!archInfo) {
    const msg = `invalid arch ${arch}, must be in ${Object.keys($.ARCHES).join(
      " ::: "
    )}`;
    throw new Error(msg);
  }

  await compile();

  $.say(`Packaging ${$.appName()} for ${os}-${arch}`);

  const electronVersion = JSON.parse(
    await $.readFile("package.json")
  ).devDependencies.electron.replace(/^\^/, "");
  $.say(`Using electron ${electronVersion}`);

  const appName = $.appName();
  const appVersion = $.buildVersion();
  const outDir = ospath.join("build", "v" + appVersion);
  const companyName = "itch corp.";

  var iconsPath = ospath.join("release", "images", appName + "-icons");
  var icoPath = ospath.join(iconsPath, "itch.ico");
  var icnsPath = ospath.join(iconsPath, "itch.icns");

  const sharedOptions = {
    dir: "prefix",
    name: appName,
    electronVersion,
    appVersion,
    asar: true,
    overwrite: true,
    out: outDir,
  };

  const shouldSign = (!!process.env.CI) || (!!process.env.FORCE_CODESIGN);
  $.say(`Code signing: ${shouldSign ? "enabled" : "disabled"}`);

  const windowsOptions = {
    platform: "win32",
    icon: icoPath,
    win32metadata: {
      CompanyName: companyName,
      LegalCopyright: "MIT license, (c) itch corp.",
      FileDescription: "the itch.io desktop app",
      OriginalFileName: appName + ".exe",
      FileVersion: appVersion,
      AppVersion: appVersion,
      ProductName: appName,
      InternalName: appName + ".exe",
    },
  };
  if (shouldSign) {
    Object.assign(windowsOptions, {});
  }

  const osxOptions = {
    platform: "darwin",
    arch: "x64",
    icon: icnsPath,
    appBundleId: $.appBundleId(),
    appCategoryType: "public.app-category.games",
    protocols: [
      {
        name: appName + ".io",
        schemes: [appName + "io"],
      },
      {
        name: appName,
        schemes: [appName],
      },
    ],
  };

  if (shouldSign) {
    if (!process.env.APPLE_ID_PASSWORD && os === "darwin") {
      throw new Error(
        `Code signing enabled, but $APPLE_ID_PASSWORD environment variable unset or empty`
      );
    }

    Object.assign(osxOptions, {
      osxSign: {
        identity: "Developer ID Application: Amos Wenger (B2N6FSRTPV)",
      },
      osxNotarize: {
        appleId: "amoswenger@gmail.com",
        appleIdPassword: process.env.APPLE_ID_PASSWORD,
      },
    });
  }

  const electronOptions = {
    "windows-ia32": Object.assign({}, sharedOptions, windowsOptions, {
      arch: "ia32",
    }),
    "windows-x64": Object.assign({}, sharedOptions, windowsOptions, {
      arch: "x64",
    }),
    "darwin-x64": Object.assign({}, sharedOptions, osxOptions),
    "linux-x64": Object.assign({}, sharedOptions, {
      platform: "linux",
      arch: "x64",
    }),
  };

  $(await $.sh("mkdir -p packages"));

  const electronPackager = require("electron-packager");

  $.say("Packaging with binary release...");
  let wd = process.cwd();
  const toUnixPath = s => {
    if (process.platform === "win32") {
      return s.replace(/\\/g, "/");
    } else {
      return s;
    }
  };

  const electronConfigKey = `${os}-${archInfo.electronArch}`;
  const electronFinalOptions = Object.assign(
    {},
    electronOptions[electronConfigKey],
    {
      afterCopy: [
        async (buildPath, electronVersion, platform, arch, callback) => {
          $.say("Cleaning modules...");
          try {
            await $.cd(buildPath, async function() {
              await $.sh(
                `${toUnixPath(ospath.join(wd, "release", "modclean.js"))} .`
              );
            });
          } catch (err) {
            $.say(`While cleaning:\n${err.stack}`);
            callback(err);
          }

          callback();
        },
      ],
    }
  );
  $.say(
    `electron-packager options: ${JSON.stringify(
      electronFinalOptions,
      null,
      2
    )}`
  );
  const appPaths = await $.measure("electron package", async () => {
    return await electronPackager(electronFinalOptions);
  });
  let buildPath = appPaths[0].replace(/\\/g, "/");

  if (shouldSign && os === "windows") {
    $.say("Signing Windows executable...");
    const windows = require("./package/windows");
    await windows.sign(buildPath);
  }

  if (os === "linux") {
    // see https://github.com/itchio/itch/issues/2121
    $.say(`Adding libgconf library...`);
    const debArch = arch === "386" ? "i386" : "amd64";
    const baseURL = `https://dl.itch.ovh/libgconf-2-4-bin`;
    const fileName = `libgconf-2.so.4`;
    const fileURL = `${baseURL}/${debArch}/${fileName}`;
    const dest = `${buildPath}/${fileName}`;
    $.say(`Downloading (${fileURL})`);
    $.say(`  to (${dest})`);
    $(await $.sh(`curl -f -L ${fileURL} -o ${dest}`));
    $(await $.sh(`chmod +x ${dest}`));
  }

  $.say(`Built app is in ${buildPath}`);

  let binaryDir = buildPath;
  if (os === "darwin") {
    binaryDir = ospath.join(binaryDir, $.appName() + ".app", "Contents", "MacOS");
  }
  let ext = os === "windows" ? ".exe" : "";
  let exeName = $.appName() + ext;
  let binaryPath = ospath.join(binaryDir, exeName);

  $.say(`Downloading dependencies`)
  await $.cd("install-deps", async () => {
    $(await $.sh("go build"));
  });
  // TODO: change to --production once stable butler versions start being tagged again
  $(await $.sh(`install-deps/install-deps --manifest package.json --dir "${binaryDir}" --development`));

  $.say(`Running integration tests on ${binaryPath}`);
  process.env.ITCH_INTEGRATION_BINARY_PATH = binaryPath;

  if (process.platform === "linux") {
    $(
      await $.sh(
        'xvfb-run -a -s "-screen 0 1280x720x24" npm run integration-tests'
      )
    );
  } else {
    $(await $.npm("run integration-tests"));
  }

  if (process.env.CI) {
    if ($.hasTag()) {
      $.say(`We're on CI and we have a tag, preparing artifacts...`);
      $(await $.sh(`mkdir -p packages`));
      if (os === "darwin") {
        $(await $.sh(`ditto ${buildPath} packages/${os}-${arch}`));
      } else {
        $(await $.sh(`mv ${buildPath} packages/${os}-${arch}`));
      }
    } else {
      $.say(
        `We're on CI but we don't have a build tag, not preparing artifacts.`
      );
    }
  } else {
    $.say(`Not on CI, not preparing artifacts.`);
  }
}

ciPackage(process.argv.slice(2));
