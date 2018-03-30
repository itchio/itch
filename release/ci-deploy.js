#!/usr/bin/env node

// deploy itch to itch.io

const fs = require("fs");
const $ = require("./common");

async function ciDeploy() {
  const dirs = fs.readdirSync("./packages");
  const packages = [];
  for (const dir of dirs) {
    const [os, arch] = dir.split("-")
    packages.push({path: dir, os, arch});
    $.say(`Queuing ${os}-${arch} build`);
  }

  $.say("Grabbing butler");
  const butlerName = `butler`;
  const butlerArch = process.arch === "x64" ? "amd64" : "386";
  const butlerUrl = `https://broth.itch.ovh/butler/linux-amd64/LATEST/.zip`;
  $(await $.sh(`curl -L ${butlerUrl} -o butler.zip`));
  $(await $.sh(`unzip butler.zip`));
  $(await $.sh(`./butler --version`));

  let wd = process.cwd();
  for (const pkg of packages) {
    const {os, arch, path} = pkg;
    let butlerChannel = os;
    let artifactPath = ospath.join(wd, "packages", path);
    if (os === "darwin") {
      butlerChannel = "mac";
      artifactPath = `${buildPath}/${$.appName()}.app`;
    }

    butlerChannel = `${butlerChannel}-${arch === "386" ? "32" : "64"}`;
    const butlerTarget = `fasterthanlime/${$.appName()}`;
    $.say(`Pushing ${os}-${arch} to itch.io...`);
    let butlerCmd = `./butler push ${artifactPath} ${butlerTarget}:${butlerChannel} --userversion=${$.buildVersion()}`;
    $(await $.sh(butlerCmd));
  }
}

ciDeploy();
