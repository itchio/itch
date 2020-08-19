import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { DownloadReason } from "common/butlerd/messages";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";

export default function (watcher: Watcher) {
  watcher.on(actions.gameUpdateAvailable, async (store, action) => {
    const { manualGameUpdates = false } = store.getState().preferences;
    if (manualGameUpdates) {
      // update will appear as main action
      return;
    }

    const { update } = action.payload;
    if (!update.direct) {
      // update will appear as main action
      return;
    }

    store.dispatch(
      actions.queueGameUpdate({ update, choice: update.choices[0] })
    );
  });

  watcher.on(actions.queueGameUpdate, async (store, action) => {
    const { update, choice } = action.payload;
    const { game } = update;
    const { upload, build } = choice;

    await mcall(messages.InstallQueue, {
      caveId: update.caveId,
      game,
      upload,
      build,
      reason: DownloadReason.Update,
      queueDownload: true,
      fastQueue: true,
    });
    store.dispatch(actions.downloadQueued({}));
  });

  watcher.on(actions.queueAllGameUpdates, async (store, action) => {
    const { updates } = store.getState().gameUpdates;

    for (const update of Object.values(updates)) {
      if (update.direct) {
        store.dispatch(
          actions.queueGameUpdate({ update, choice: update.choices[0] })
        );
      }
    }
  });
}
