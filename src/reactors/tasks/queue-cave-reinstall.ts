import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "queue-cave-reinstall" });

import { withButlerClient, messages } from "../../buse";

export default function(watcher: Watcher) {
  watcher.on(actions.queueCaveReinstall, async (store, action) => {
    const { caveId } = action.payload;

    await withButlerClient(logger, async client => {
      await client.call(messages.InstallQueue({ caveId, queueDownload: true }));
      store.dispatch(actions.downloadQueued({}));
    });
  });
}
