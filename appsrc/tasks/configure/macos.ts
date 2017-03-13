
import * as bluebird from "bluebird";
import * as ospath from "path";
import sf from "../../util/sf";

import { IConfigureOpts, IConfigureResult, fixExecs } from "./common";

export async function configure(opts: IConfigureOpts, cavePath: string): Promise<IConfigureResult> {
  const bundles: string[] = [];

  const globRes = await sf.glob("**/*.app/", { cwd: cavePath });

  for (const res of globRes) {
    let skip = false;

    const pathElements = res.split(ospath.sep);
    let currentElements: string[] = [];
    for (const element of pathElements) {
      if (element === "__MACOSX") {
        skip = true;
        break;
      }

      currentElements = [...currentElements, element];
      const path = ospath.join(cavePath, ...currentElements);
      try {
        const stats = await sf.lstat(path);
        if (stats.isSymbolicLink()) {
          skip = true;
          break;
        }
      } catch (e) {
        if (e.code === "ENOENT" || e.code === "EPERM") {
          skip = true;
          break;
        } else {
          throw e;
        }
      }
    }

    if (!skip) {
      bundles.push(res + "/");
    }
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
