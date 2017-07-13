import * as actions from "../actions";
import { Watcher } from "./watcher";
import { DB } from "../db";

import * as paths from "../os/paths";

import { IQueueDownloadPayload } from "../constants/action-types";

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
      }),
    );
  });

  watcher.on(actions.queueGameUpdate, async (store, action) => {
    const { update, upload, handPicked, caveId } = action.payload;
    const { game, incremental, upgradePath } = update;

    const state = store.getState();

    const destPath = paths.downloadPath(upload, state.preferences);

    let totalSize = upload.size;
    if (update.incremental) {
      totalSize = 0;
      for (const item of update.upgradePath) {
        totalSize += item.patchSize;
      }
    }

    const downloadOpts = {
      caveId,
      game,
      upload,
      destPath,
      totalSize,
      incremental,
      upgradePath,
      handPicked,
      reason: "update",
    } as IQueueDownloadPayload;

    store.dispatch(actions.queueDownload(downloadOpts));
  });
}
