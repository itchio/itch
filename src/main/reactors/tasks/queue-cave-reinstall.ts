import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "queue-cave-reinstall" });

import { messages, withLogger } from "common/butlerd";
const call = withLogger(logger);

import { DownloadReason } from "common/butlerd/messages";

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
