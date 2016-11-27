
import mklog from "../../util/log";
const log = mklog("configure/compute-size");

import butler from "../../util/butler";

async function computeFolderSize(opts: any, appPath: string): Promise<number> {
  log(opts, `computing size of ${appPath}`);
  try {
    return await butler.sizeof({
      path: appPath,
    });
  } catch (e) {
    log(opts, `could not compute size of ${appPath}: ${e.message}`);
  }
  return 0;
}

export default { computeFolderSize };
