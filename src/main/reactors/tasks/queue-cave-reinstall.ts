import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { DownloadReason } from "common/butlerd/messages";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";

export default function (watcher: Watcher) {
  watcher.on(actions.queueCaveReinstall, async (store, action) => {
    const { caveId } = action.payload;

    await mcall(messages.InstallQueue, {
      caveId,
      reason: DownloadReason.Reinstall,
      queueDownload: true,
      fastQueue: true,
    });
    store.dispatch(actions.downloadQueued({}));
  });
}
