#!/usr/bin/env node

// compile itch for production environemnts

const $ = require("./common");
const humanize = require("humanize-plus");

async function main() {
  $.say(`Preparing to compile ${$.appName()} ${$.buildVersion()}`);

  await $.showVersions(["npm", "node"]);

  $(await $.npm("install"));

  $.say("Wiping dist...");
  $(await $.sh("rm -rf dist"));

  $.say("Compiling sources...");
  $(await $.sh("npm run compile"));

  $.say("Generating custom package.json...");
  const pkg = JSON.parse(await $.readFile("package.json"));
  for (const field of ["name", "productName", "desktopName"]) {
    pkg[field] = $.appName();
  }
  delete pkg.scripts.postinstall;
  pkg.version = $.buildVersion();
  const pkgContents = JSON.stringify(pkg, null, 2);
  await $.writeFile(`dist/package.json`, pkgContents);

  $.say("Compressing dist...");
  $(await $.sh("tar cf dist.tar dist"));

  const stats = await $.lstat("dist.tar");
  $.say(`dist.tar is ${humanize.fileSize(stats.size)}`);
}

main();
