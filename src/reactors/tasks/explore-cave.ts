import { Watcher } from "../watcher";
import { actions } from "../../actions";
import * as fs from "fs";
import { dirname } from "path";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "explore-cave" });

import * as explorer from "../../os/explorer";

import { withButlerClient, messages } from "../../buse";

export default function(watcher: Watcher) {
  watcher.on(actions.exploreCave, async (store, action) => {
    const { caveId } = action.payload;

    const { cave } = await withButlerClient(logger, async client => {
      return await client.call(messages.FetchCave({ caveId }));
    });

    const installFolder = cave.installInfo.installFolder;
    try {
      fs.accessSync(installFolder);
      explorer.open(installFolder);
    } catch (e) {
      explorer.open(dirname(installFolder));
    }
  });
}
