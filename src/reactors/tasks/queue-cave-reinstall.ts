import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "queue-cave-reinstall" });

import { withButlerClient, messages } from "../../buse";
import { commitInstall } from "./queue-game";

export default function(watcher: Watcher) {
  watcher.on(actions.queueCaveReinstall, async (store, action) => {
    const { caveId } = action.payload;

    await withButlerClient(logger, async client => {
      const res = await client.call(messages.InstallQueue({ caveId }));
      commitInstall(store, "reinstall", res);
    });
  });
}
