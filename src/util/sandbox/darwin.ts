
import * as ospath from "path";
import * as tmp from "tmp";

import sandboxTemplate from "../../constants/sandbox-policies/macos-template";

import spawn from "../../os/spawn";
import * as sf from "../../os/sf";

import common from "./common";

import {INeed, IWithinOpts, IWithinCbOpts} from "./types";

const INVESTIGATE_SANDBOX = process.env.INVESTIGATE_SANDBOX === "1";

export async function check() {
  const needs: INeed[] = [];
  const errors: Error[] = [];

  const seRes = await spawn.exec({ command: "sandbox-exec", args: ["-n", "no-network", "true"] });
  if (seRes.code !== 0) {
    errors.push(new Error("sandbox-exec is missing. Is macOS too old?"));
  }

  return { needs, errors };
}

export async function within(opts: IWithinOpts, cb: (opts: IWithinCbOpts) => Promise<void>) {
  const {appPath, exePath, fullExec, argString, game, isBundle, logger} = opts;

  const cwd = opts.cwd || ospath.dirname(fullExec);

  logger.info("generating sandbox policy");
  const sandboxProfilePath = ospath.join(appPath, ".itch", "isolate-app.sb");

  const userLibrary = (await spawn.getOutput({
    command: "activate",
    args: ["--print-library-paths"],
    logger: opts.logger,
  })).split("\n")[0].trim();
  logger.info(`user library = '${userLibrary}'`);

  const sandboxSource = sandboxTemplate
    .replace(/{{USER_LIBRARY}}/g, userLibrary)
    .replace(/{{INSTALL_LOCATION}}/g, appPath);
  await sf.writeFile(sandboxProfilePath, sandboxSource, {encoding: "utf8"});

  logger.info("creating fake app bundle");
  const workDir = tmp.dirSync();
  const exeName = ospath.basename(fullExec);

  const realApp = exePath;
  let fakeApp: string;
  if (isBundle) {
    fakeApp = ospath.join(workDir.name, ospath.basename(realApp));
  } else {
    fakeApp = ospath.join(workDir.name, game.title + ".app");
  }
  logger.info(`fake app path: ${fakeApp}`);

  await sf.mkdir(fakeApp);
  await sf.mkdir(ospath.join(fakeApp, "Contents"));
  await sf.mkdir(ospath.join(fakeApp, "Contents", "MacOS"));

  const fakeBinary = ospath.join(fakeApp, "Contents", "MacOS", exeName);
  await sf.writeFile(fakeBinary,
    `#!/bin/bash
cd ${spawn.escapePath(cwd)}
sandbox-exec -f ${spawn.escapePath(sandboxProfilePath)} ${spawn.escapePath(fullExec)} ${argString}`,
  {encoding: "utf8"});
  await sf.chmod(fakeBinary, 0o700);

  if (isBundle) {
    await sf.symlink(
      ospath.join(realApp, "Contents", "Resources"),
      ospath.join(fakeApp, "Contents", "Resources"),
    );

    await sf.symlink(
      ospath.join(realApp, "Contents", "Info.plist"),
      ospath.join(fakeApp, "Contents", "Info.plist"),
    );
  } else {
    await sf.writeFile(ospath.join(fakeApp, "Contents", "Info.plist"),
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>${exeName}</string>
</dict>
</plist>`, {encoding: "utf8"});
  }

  let err: Error;
  try {
    await cb({ fakeApp });
  } catch (e) { err = e; }

  if (INVESTIGATE_SANDBOX) {
    logger.warn("waiting forever for someone to investigate the sandbox");
    await new Promise((resolve, reject) => null);
  }

  logger.info("cleaning up fake app");
  await sf.wipe(fakeApp);
  workDir.removeCallback();

  if (err) {
    throw err;
  }
}

export async function install(opts: any, needs: INeed[]) {
  return await common.tendToNeeds(opts, needs, {});
}

export async function uninstall(opts: any) {
  return { errors: [] };
}

export default { check, install, uninstall, within };
