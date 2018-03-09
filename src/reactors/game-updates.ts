import { actions } from "../actions";
import { Watcher } from "./watcher";
import { each } from "underscore";
import { withButlerClient, messages } from "../buse";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "game-updates" });

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

    await withButlerClient(logger, async client => {
      const item = await client.call(
        messages.InstallQueue({
          caveId: update.itemId,
          game,
          upload,
          build,
        })
      );
      await client.call(messages.DownloadsQueue({ item }));
    });
  });

  watcher.on(actions.queueAllGameUpdates, async (store, action) => {
    const { updates } = store.getState().gameUpdates;
    each(updates, update => {
      store.dispatch(actions.queueGameUpdate({ update }));
    });
  });
}
