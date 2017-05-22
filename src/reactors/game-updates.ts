
import * as actions from "../actions";
import {Watcher} from "./watcher";

import * as paths from "../os/paths";

import {IQueueDownloadPayload} from "../constants/action-types";

export default function (watcher: Watcher) {
  watcher.on(actions.gameUpdateAvailable, async (store, action) => {
    const manualGameUpdates: boolean = store.getState().preferences.manualGameUpdates;
    if (manualGameUpdates) {
      // update will appear as main action
      return;
    }

    const {recentUploads} = action.payload.update;
    if (recentUploads.length > 1) {
      // let user decide
      return;
    }

    store.dispatch(actions.queueGameUpdate({
      ...action.payload,
      upload: recentUploads[0],
    }));
  });

  watcher.on(actions.queueGameUpdate, async (store, action) => {
    const {update, upload, handPicked} = action.payload;
    const {game, downloadKey, incremental, upgradePath} = update;

    const state = store.getState();
    // FIXME: db
    const cave: any = null;
    // const cave = state.globalMarket.caves[action.payload.caveId];

    const destPath = paths.downloadPath(upload, state.preferences);

    let totalSize = upload.size;
    if (update.incremental) {
      totalSize = 0;
      for (const item of update.upgradePath) {
        totalSize += item.patchSize;
      }
    }

    const downloadOpts = {
      cave,
      game,
      gameId: game.id, // FIXME: why is this needed? we have game!
      upload,
      destPath,
      totalSize,
      downloadKey,
      incremental,
      upgradePath,
      handPicked,
      reason: "update",
    } as IQueueDownloadPayload;

    store.dispatch(actions.queueDownload(downloadOpts));
  });
}
