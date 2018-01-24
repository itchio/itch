import * as actions from "../actions";
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

    const { recentUploads } = action.payload.update;
    if (recentUploads.length > 1) {
      // let user decide
      return;
    }

    store.dispatch(
      actions.queueGameUpdate({
        ...action.payload,
        upload: recentUploads[0],
      })
    );
  });

  watcher.on(actions.queueGameUpdate, async (store, action) => {
    const { update, upload, caveId } = action.payload;
    const { game } = update;

    store.dispatch(
      actions.queueDownload({
        game,
        caveId,
        upload,
        build: upload.build,
        reason: "update",
      })
    );
  });
}
