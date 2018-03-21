import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "queue-cave-reinstall" });

import { messages, withLogger } from "../../buse";
const call = withLogger(logger);

import { DownloadReason } from "../../buse/messages";

export default function(watcher: Watcher) {
  watcher.on(actions.queueCaveReinstall, async (store, action) => {
    const { caveId } = action.payload;

    await call(messages.InstallQueue, {
      caveId,
      reason: DownloadReason.Reinstall,
      queueDownload: true,
    });
    store.dispatch(actions.downloadQueued({}));
  });
}
