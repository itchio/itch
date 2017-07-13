import { Watcher } from "../watcher";
import * as actions from "../../actions";

import { shell } from "electron";

import * as paths from "../../os/paths";
import logger from "../../logger";

export default function(watcher: Watcher) {
  watcher.on(actions.probeCave, async (store, action) => {
    const { caveId } = action.payload;

    const caveLogPath = paths.caveLogPath(caveId);
    logger.info(`Opening cave log path ${caveLogPath}`);
    shell.openItem(caveLogPath);
  });
}
