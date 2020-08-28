//@ts-check
"use strict";

const fs = require("fs");
const { $ } = require("@itchio/bob");
const { getAppName, getBuildVersion } = require("./common");
const ospath = require("path");

async function ciDeploy() {
  const dirs = fs.readdirSync("./artifacts");

  /** @type {{path: string, os: string, arch: string}[]} */
  const packages = [];
  for (const dir of dirs) {
    const [os, arch] = dir.split("-");
    packages.push({ path: dir, os, arch });
    console.log(`Queuing ${os}-${arch} build`);
  }

  console.log("Grabbing butler");
  const butlerUrl = `https://broth.itch.ovh/butler/linux-amd64/LATEST/.zip`;
  $(`curl -L ${butlerUrl} -o butler.zip`);
  $(`unzip butler.zip`);
  $(`./butler --version`);

  let wd = process.cwd();
  for (const pkg of packages) {
    const { os, arch, path } = pkg;
    let artifactPath = ospath.join(wd, "artifacts", path);
    if (os === "darwin") {
      artifactPath = `${artifactPath}/${getAppName()}.app`;
    }

    let butlerChannel = `${os}-${arch}`;
    const butlerTarget = `itchio/${getAppName()}`;
    console.log(`Pushing ${os}-${arch} to itch.io...`);
    let butlerCmd = `./butler push ${artifactPath} ${butlerTarget}:${butlerChannel} --userversion=${getBuildVersion()} --no-auto-wrap`;
    $(butlerCmd);
  }
}

ciDeploy();
