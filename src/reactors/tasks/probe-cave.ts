
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {shell} from "electron";

import pathmaker from "../../util/pathmaker";

import mklog from "../../util/log";
const log = mklog("probe-cave");

export default function (watcher: Watcher) {
  watcher.on(actions.probeCave, async (store, action) => {
    const {caveId} = action.payload;

    const logger = pathmaker.caveLogger(caveId);
    const caveLogPath = pathmaker.caveLogPath(caveId);
    const opts = {
      logger,
    };
    log(opts, `Opening cave log path ${caveLogPath}`);
    shell.openItem(caveLogPath);
  });
}
