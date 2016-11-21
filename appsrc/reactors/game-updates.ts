
import * as actions from "../actions";
import {Watcher} from "./watcher";

import pathmaker from "../util/pathmaker";

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

    store.dispatch(actions.queueGameUpdate(Object.assign({}, action.payload, {
      upload: recentUploads[0],
    })));
  });

  watcher.on(actions.queueGameUpdate, async (store, action) => {
    const {update, upload} = action.payload;
    const {game, downloadKey} = update;

    const archivePath = pathmaker.downloadPath(upload);

    store.dispatch(actions.queueDownload({
      game,
      gameId: game.id,
      upload,
      totalSize: upload.size,
      destPath: archivePath,
      downloadKey,
      handPicked: true,
      reason: "update",
    }));
  });
}
