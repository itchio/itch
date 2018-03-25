import { actions } from "../actions";
import { Watcher } from "./watcher";
import { each } from "underscore";
import { messages, withLogger } from "../butlerd";

import rootLogger from "../logger";
import { DownloadReason } from "../butlerd/messages";
const logger = rootLogger.child({ name: "game-updates" });
const call = withLogger(logger);

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

    await call(messages.InstallQueue, {
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
