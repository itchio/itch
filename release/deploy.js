//@ts-check

import fs from "fs";
import { $ } from "@itchio/bob";
import { getAppName, getBuildVersion, OSES } from "./common.js";
import ospath from "path";

const VALID_ARCHES = ["amd64", "arm64", "universal", "386"];

/**
 * Parse artifact directory name to extract os and arch.
 * Handles GitHub Actions artifact names like "kitch-v1.0.0-linux-amd64"
 * @param {string} dir
 * @returns {{os: string, arch: string} | null}
 */
function parseArtifactDir(dir) {
  const parts = dir.split("-");
  if (parts.length < 2) return null;

  const arch = parts[parts.length - 1];
  const os = parts[parts.length - 2];

  if (!VALID_ARCHES.includes(arch)) return null;
  if (!(os in OSES)) return null;

  return { os, arch };
}

async function ciDeploy() {
  const dirs = fs.readdirSync("./artifacts");

  /** @type {{path: string, os: string, arch: string}[]} */
  const packages = [];
  for (const dir of dirs) {
    const parsed = parseArtifactDir(dir);
    if (!parsed) {
      console.log(`Skipping ${dir} (not a valid artifact directory)`);
      continue;
    }
    const { os, arch } = parsed;
    packages.push({ path: dir, os, arch });
    console.log(`Queuing ${os}-${arch} build`);
  }

  console.log("Grabbing butler");
  const butlerUrl = `https://broth.itch.zone/butler/linux-amd64/LATEST/.zip`;
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
