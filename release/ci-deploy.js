//@ts-check
"use strict";

const fs = require("fs");
const { sh, say, getAppName, getBuildVersion } = require("./common");
const ospath = require("path");

async function ciDeploy() {
  const dirs = fs.readdirSync("./packages");

  /** @type {{path: string, os: string, arch: string}[]} */
  const packages = [];
  for (const dir of dirs) {
    const [os, arch] = dir.split("-");
    packages.push({ path: dir, os, arch });
    say(`Queuing ${os}-${arch} build`);
  }

  say("Grabbing butler");
  const butlerUrl = `https://broth.itch.ovh/butler/linux-amd64/LATEST/.zip`;
  sh(`curl -L ${butlerUrl} -o butler.zip`);
  sh(`unzip butler.zip`);
  sh(`./butler --version`);

  let wd = process.cwd();
  for (const pkg of packages) {
    const { os, arch, path } = pkg;
    let artifactPath = ospath.join(wd, "packages", path);
    if (os === "darwin") {
      artifactPath = `${artifactPath}/${getAppName()}.app`;
    }

    let butlerChannel = `${os}-${arch}`;
    const butlerTarget = `fasterthanlime/${getAppName()}`;
    say(`Pushing ${os}-${arch} to itch.io...`);
    let butlerCmd = `./butler push ${artifactPath} ${butlerTarget}:${butlerChannel} --userversion=${getBuildVersion()} --no-auto-wrap`;
    sh(butlerCmd);
  }
}

ciDeploy();
