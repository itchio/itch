import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { DownloadReason } from "common/butlerd/messages";
import { Watcher } from "common/util/watcher";
import { each } from "underscore";
import { mcall } from "main/butlerd/mcall";

export default function(watcher: Watcher) {
  watcher.on(actions.gameUpdateAvailable, async (store, action) => {
    const manualGameUpdates: boolean = store.getState().preferences
      .manualGameUpdates;
    if (manualGameUpdates) {
      // update will appear as main action
      return;
    }

    store.dispatch(actions.queueGameUpdate(action.payload));
  });

  watcher.on(actions.queueGameUpdate, async (store, action) => {
    const { update } = action.payload;
    const { game, upload, build } = update;

    await mcall(messages.InstallQueue, {
      caveId: update.itemId,
      game,
      upload,
      build,
      reason: DownloadReason.Update,
      queueDownload: true,
    });
    store.dispatch(actions.downloadQueued({}));
  });

  watcher.on(actions.queueAllGameUpdates, async (store, action) => {
    const { updates } = store.getState().gameUpdates;
    each(updates, update => {
      store.dispatch(actions.queueGameUpdate({ update }));
    });
  });
}
