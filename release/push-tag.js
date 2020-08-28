//@ts-check
"use strict";

const { $, prompt, confirm } = require("@itchio/bob");
const { readFileSync, writeFileSync } = require("fs");
const { resolve } = require("path");

async function pushTag() {
  const pkgPath = resolve(__dirname, "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, { encoding: "utf-8" }));
  const pkgVersion = pkg.version;

  let force = false;
  const args = [];
  for (const arg of process.argv.slice(2)) {
    switch (arg) {
      case "--force":
        console.log("(Running in forced mode)");
        force = true;
        break;
      default:
        if (/^--/.test(arg)) {
          throw new Error(`Unknown option ${arg}`);
        }
        args.push(arg);
    }
  }

  const versionInput =
    args[0] || (await prompt(`Package version is: ${pkg.version}, type yours in vX.Y.Z(-canary?) format`));
  if (!/^v\d+.\d+.\d+(-canary)?$/.test(versionInput)) {
    throw new Error(
      `Version must be of the form /vX.Y.Z(-canary)?/ (was '${versionInput}')`
    );
  }

  const nextVersion = versionInput.replace(/^v/, "");

  if (pkgVersion !== nextVersion) {
    if (!force) {
      await confirm(`Bump package.json? [${pkgVersion} => ${nextVersion}]`);
    }
    pkg.version = nextVersion;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), { encoding: "utf-8" });
    console.log("Bumped package.json");
    console.log("Letting npm bump package-lock.json...");
    $(`npm i`);
    $(`git add package.json package-lock.json`);
    // note: `--no-verify` works around a lint-staged@10.2.13 path bug
    // on msys2 on Windows.
    $(`git commit -m ':arrow_up: ${nextVersion}' --no-verify`);
  }

  const tag = `v${nextVersion}`;
  const isCanary = /-canary$/.test(nextVersion);
  const addCmd = `git tag ${isCanary ? "" : "-s"} -a ${tag} -m ${tag}`;

  try {
    $(addCmd);
    console.log("Tag added...");
  } catch (e) {
    if (!force) {
      await confirm("Tag already exists locally. Replace?");
    }
    $(`git tag -d ${tag}`);
    $(addCmd);
  }

  const pushCmd = `git push origin ${tag}`;
  try {
    $(pushCmd);
    console.log("Tag pushed...");
  } catch (e) {
    if (!force) {
      confirm("Tag already exists on remote. Force-push?");
    }
    $(`${pushCmd} --force`);
  }

  $("git push");
}

pushTag();
