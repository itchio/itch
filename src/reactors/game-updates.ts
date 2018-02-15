import { actions } from "../actions";
import { Watcher } from "./watcher";
import { DB } from "../db";

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
    const { update, caveId } = action.payload;
    const { game, upload, build } = update;

    store.dispatch(
      actions.queueDownload({
        game,
        caveId,
        upload,
        build,
        reason: "update",
      })
    );
  });
}
