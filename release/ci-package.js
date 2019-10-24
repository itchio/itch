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
      " ::: ",
    )}`;
    throw new Error(msg);
  }

  const archInfo = $.ARCHES[arch];
  if (!archInfo) {
    const msg = `invalid arch ${arch}, must be in ${Object.keys($.ARCHES).join(
      " ::: ",
    )}`;
    throw new Error(msg);
  }

  await compile();

  $.say(`Packaging ${$.appName()} for ${os}-${arch}`);

  const electronVersion = JSON.parse(
    await $.readFile("package.json"),
  ).devDependencies.electron.replace(/^\^/, "");
  $.say(`Using electron ${electronVersion}`);

  const appName = $.appName();
  const appVersion = $.buildVersion();
  const outDir = ospath.join("build", "v" + appVersion);
  const companyName = "itch corp.";

  var iconsPath = ospath.join("release", "images", appName + "-icons");
  var icoPath = ospath.join(iconsPath, "itch.ico");
  var icnsPath = ospath.join(iconsPath, "itch.icns");

  const electronSharedOptions = {
    dir: "prefix",
    name: appName,
    electronVersion,
    appVersion,
    asar: true,
    prune: true,
    overwrite: true,
    out: outDir,
  };

  const electronWindowsOptions = Object.assign({}, electronSharedOptions, {
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
  });

  const electronOptions = {
    "windows-ia32": Object.assign({ arch: "ia32" }, electronWindowsOptions),
    "windows-x64": Object.assign({ arch: "x64" }, electronWindowsOptions),
    "darwin-x64": Object.assign({}, electronSharedOptions, {
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
    }),
    "linux-x64": Object.assign({}, electronSharedOptions, {
      platform: "linux",
      arch: "x64",
    }),
  };

  $(await $.sh("mkdir -p packages"));

  const darwin = require("./package/darwin");
  const windows = require("./package/windows");

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
                `${toUnixPath(ospath.join(wd, "release", "modclean.js"))} .`,
              );
            });
          } catch (err) {
            $.say(`While cleaning:\n${err.stack}`);
            callback(err);
          }

          callback();
        },
      ],
    },
  );
  $.say(
    `electron-packager options: ${JSON.stringify(
      electronFinalOptions,
      null,
      2,
    )}`,
  );
  const appPaths = await $.measure("electron package", async () => {
    return await electronPackager(electronFinalOptions);
  });
  let buildPath = appPaths[0].replace(/\\/g, "/");

	if (os === "linux") {
		// see https://github.com/itchio/itch/issues/2121
		$.say(`Adding libgconf library...`);
		const debArch = (arch === "386" ? "i386" : "amd64");
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

  if (process.env.CI) {
    $.say(`We're on CI, signing app...`);
    switch (os) {
      case "windows":
        await windows.sign(arch, buildPath);
        break;
      case "darwin":
        await darwin.sign(arch, buildPath);
        break;
      case "linux":
        // tl;dr code-signing on Linux isn't a thing
        break;
    }
  } else {
    $.say(`Not on CI, not signing app`)
  }

  let ext = os === "windows" ? ".exe" : "";

  let exeName = $.appName() + ext;
  if (os === "darwin") {
    exeName = ospath.join($.appName() + ".app", "Contents", "MacOS", exeName);
  }
  let binaryPath = ospath.join(buildPath, exeName);

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
      $.say(`We're on CI and we have a tag, preparing artifacts...`)
      $(await $.sh(`mkdir -p packages`));
      if (os === "darwin") {
        $(await $.sh(`ditto ${buildPath} packages/${os}-${arch}`));
      } else {
        $(await $.sh(`mv ${buildPath} packages/${os}-${arch}`));
      }
    } else {
      $.say(`We're on CI but we don't have a build tag, not preparing artifacts.`)
    }
  } else {
    $.say(`Not on CI, not preparing artifacts.`)
  }
}

ciPackage(process.argv.slice(2));
