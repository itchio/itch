import { actions } from "../actions";
import { Watcher } from "./watcher";
import { DB } from "../db";
import { each } from "underscore";

export default function(watcher: Watcher, db: DB) {
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

    store.dispatch(
      actions.queueDownload({
        game,
        caveId: update.itemId,
        upload,
        build,
        reason: "update",
      })
    );
  });

  watcher.on(actions.queueAllGameUpdates, async (store, action) => {
    const { updates } = store.getState().gameUpdates;
    each(updates, update => {
      store.dispatch(actions.queueGameUpdate({ update }));
    });
  });
}
