
import sf from "../../util/sf";
import pathmaker from "../../util/pathmaker";

import * as bluebird from "bluebird";
import * as ospath from "path";

export async function cleanOldLogs () {
  const logDir = ospath.dirname(pathmaker.logPath());
  const allLogs = await sf.glob("*.txt", {cwd: logDir});

  const promises: Promise<any>[] = [];
  for (const log of allLogs) {
    if (/itch\.txt(\.[0-9])?$/.test(log)) {
      // these are logrotate logs, keep!
      return;
    }

    const fullPath = ospath.join(logDir, log);
    // eschewing wipe in case something goes cray-cray
    promises.push(sf.unlink(fullPath));
  }

  await bluebird.all(promises);
}
