
// sic. this module is named osx, even though the OS is now named
// macOS, for consistency with the itch.io API

import * as bluebird from "bluebird";
import * as pathModule from "path";
const ospath = pathModule.posix;
import sf from "../../util/sf";

import mklog from "../../util/log";
const log = mklog("configure/osx");

import { IConfigureOpts, IConfigureResult, fixExecs } from "./common";

export async function configure(opts: IConfigureOpts, cavePath: string): Promise<IConfigureResult> {
  const bundles: string[] = [];

  const globRes = await sf.glob("**/*.app/", { cwd: cavePath });

  const examineBundle = async (res: string) => {
    const pathElements = res.split(ospath.sep);
    log(opts, `path elements: ${JSON.stringify(pathElements)}`);
    let currentElements: string[] = [];
    for (const element of pathElements) {
      if (element === "__MACOSX") {
        log(opts, `Skipping ${res}, it contains __MACOSX`);
        return;
      }

      currentElements = [...currentElements, element];
      const path = ospath.join(cavePath, ...currentElements);
      try {
        const stats = await sf.lstat(path);
        if (stats.isSymbolicLink()) {
          log(opts, `Skipping ${res}, ${path} is a symlink`);
          return;
        }
      } catch (e) {
        if (e.code === "ENOENT" || e.code === "EPERM") {
          log(opts, `Skipping ${res}, ${path} did not exist or wasn't readable for us`);
          return;
        } else {
          throw e;
        }
      }
    }

    const checkRes = await checkAppBundle(ospath.join(cavePath, res));
    if (!checkRes.valid) {
      log(opts, `Skipping ${res}, not a valid app bundle: ${checkRes.reason}`);
      return;
    }

    log(opts, `${res}: Looks like the real thing!`);
    bundles.push(res + "/");
  };

  for (const res of globRes) {
    await examineBundle(res);
  }

  if (bundles.length) {
    const fixer = (x: string) => fixExecs(opts, "macExecutable", ospath.join(cavePath, x));
    await bluebird.each(bundles, fixer);
    return { executables: bundles };
  }

  // some games aren't properly packaged app bundles but rather a shell
  // script / binary - try it the linux way
  const fixResult = await fixExecs(opts, "macExecutable", cavePath);
  return { executables: fixResult.executables };
}

interface IAppBundleResult {
  valid: boolean;
  reason: string;
}

export async function checkAppBundle(appBundlePath: string): Promise<IAppBundleResult> {
    const plistPath = ospath.join(appBundlePath, "Contents", "Info.plist");

    if (!(await sf.exists(plistPath))) {
      return {valid: false, reason: "Missing Info.pList"};
    }

    return {valid: true, reason: "Looks good"};
}

export function isAppBundle (exePath: string) {
  return /\.app\/?$/.test(exePath.toLowerCase());
}
