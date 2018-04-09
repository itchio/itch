import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import { shell } from "electron";

import * as paths from "common/util/paths";
import logger from "common/logger";

export default function(watcher: Watcher) {
  watcher.on(actions.probeCave, async (store, action) => {
    const { caveId } = action.payload;

    const caveLogPath = paths.caveLogPath(caveId);
    logger.info(`Opening cave log path ${caveLogPath}`);
    shell.openItem(caveLogPath);
  });
}
