import { Watcher } from "../watcher";
import { actions } from "../../actions";
import * as fs from "fs";
import { dirname } from "path";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "explore-cave" });

import * as explorer from "../../os/explorer";

import { withLogger, messages } from "../../butlerd";
const call = withLogger(logger);

export default function(watcher: Watcher) {
  watcher.on(actions.exploreCave, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await call(messages.FetchCave, { caveId });
    const installFolder = cave.installInfo.installFolder;
    try {
      fs.accessSync(installFolder);
      explorer.open(installFolder);
    } catch (e) {
      explorer.open(dirname(installFolder));
    }
  });
}
