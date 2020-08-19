import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { Watcher } from "common/util/watcher";
import fs from "fs";
import { dirname } from "path";
import * as explorer from "main/os/explorer";
import { mcall } from "main/butlerd/mcall";

export default function (watcher: Watcher) {
  watcher.on(actions.exploreCave, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await mcall(messages.FetchCave, { caveId });
    const installFolder = cave.installInfo.installFolder;
    try {
      fs.accessSync(installFolder);
      explorer.open(installFolder);
    } catch (e) {
      explorer.open(dirname(installFolder));
    }
  });
}
