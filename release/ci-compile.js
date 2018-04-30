#!/usr/bin/env node

// compile itch for production environemnts

const $ = require("./common");
const humanize = require("humanize-plus");

async function main() {
  $.say(`Preparing to compile ${$.appName()} ${$.buildVersion()}`);

  await $.showVersions(["npm", "node"]);

  $(await $.npm("install"));

  $.say("Wiping prefix...");
  $(await $.sh("rm -rf prefix"));
  $(await $.sh("mkdir -p prefix"));

  $.say("Compiling sources...");
  $(await $.sh("npm run compile"));

  $.say("Copying dist to prefix...");
  $(await $.sh("cp -rf dist prefix/"));

  $.say("Copying static resources to prefix...");
  $(await $.sh("mkdir prefix/src"));
  $(await $.sh("cp -rf src/static prefix/src"));

  $.say("Generating custom package.json...");
  const pkg = JSON.parse(await $.readFile("package.json"));
  for (const field of ["name", "productName", "desktopName"]) {
    pkg[field] = $.appName();
  }
  delete pkg.scripts.postinstall;
  pkg.version = $.buildVersion();
  const pkgContents = JSON.stringify(pkg, null, 2);
  await $.writeFile(`prefix/package.json`, pkgContents);

  $.say("Compressing prefix...");
  $(await $.sh("tar cf prefix.tar prefix"));

  const stats = await $.lstat("prefix.tar");
  $.say(`prefix.tar is ${humanize.fileSize(stats.size)}`);
}

main();
