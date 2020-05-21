//@ts-check
"use strict";

const {
  say,
  sh,
  getAppName,
  getBuildVersion,
  readFile,
  writeFile,
  cd,
} = require("../common");

/**
 * @param {import("./context").Context} cx
 */
async function build(cx) {
  say(`Building ${getAppName()} ${getBuildVersion()}`);

  say("Wiping prefix/");
  sh("rm -rf prefix");
  sh("mkdir -p prefix");

  say("Compiling sources");
  sh("npm run compile");

  say("Copying dist files to prefix/");
  sh("cp electron-index.js prefix/");
  sh("mkdir -p prefix/dist");
  sh("cp -rf dist/production prefix/dist/");

  say("Generating custom package.json");
  const pkg = JSON.parse(await readFile("package.json"));
  for (const field of ["name", "productName", "desktopName"]) {
    pkg[field] = getAppName();
  }
  pkg.version = getBuildVersion();
  const pkgContents = JSON.stringify(pkg, null, 2);
  await writeFile(`prefix/package.json`, pkgContents);

  say("Downloading valet binaries");
  let valetArch = cx.archInfo.electronArch === "ia32" ? "i686" : "x86_64";
  let otherValetArch = valetArch == "i686" ? "x86_64" : "i686";
  await cd("node_modules/@itchio/valet", async function () {
    sh(`npm run postinstall -- --verbose --arch ${valetArch}`);
  });

  say("Copying valet to prefix");
  sh("mkdir -p prefix/node_modules/@itchio");
  sh("cp -rf node_modules/@itchio/valet prefix/node_modules/@itchio");
  say("Trimming down valet install");
  sh(`rm -rf prefix/node_modules/@itchio/valet/artifacts/${otherValetArch}-*`);

  say("Installing required externals");
  const externals = [
    // TODO: is it really a good idea to ship that in production?
    "source-map-support",
  ];
  await cd("prefix", async function () {
    sh(`npm install --no-save ${externals.join(" ")}`);
  });
}

module.exports = { build };
