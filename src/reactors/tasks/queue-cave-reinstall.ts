
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {findWhere} from "underscore";

import {startTask} from "./start-task";

import * as paths from "../../os/paths";
import fetch from "../../util/fetch";

// FIXME: db
const globalMarket: any = null;
const userMarket: any = null;

export default function (watcher: Watcher) {
  watcher.on(actions.queueCaveReinstall, async (store, action) => {
    const {caveId} = action.payload;
    const cave = globalMarket.getEntity("caves", caveId);
    if (!cave) {
      // can't reinstall without a valid cave!
      return;
    }

    const credentials = store.getState().session.credentials;
    const game = await fetch.gameLazily(userMarket, credentials, cave.gameId);
    if (!game) {
      // no valid game
      return;
    }

    if (!cave.uploadId || !cave.uploads) {
      // no uploads in cave
      return;
    }

    const uploadResponse = await startTask(store, {
      name: "find-upload",
      gameId: game.id,
      game: game,
    });
    const upload = uploadResponse.result.uploads[0];

    if (!upload) {
      // couldn't find an upload
      return;
    }

    const state = store.getState();
    const tasksForGame = state.tasks.tasksByGameId[cave.gameId];
    if (tasksForGame && tasksForGame.length > 0) {
      store.dispatch(actions.statusMessage({
        message: ["status.reinstall.busy", {title: cave.game.title}],
      }));
      return;
    }

    const archivePath = paths.downloadPath(upload, store.getState().preferences);

    const findDownloadKey = () => {
      return findWhere(userMarket.getEntities("downloadKeys"), {gameId: game.id});
    };

    store.dispatch(actions.queueDownload({
      game,
      upload,
      totalSize: upload.size,
      destPath: archivePath,
      downloadKey: cave.downloadKey || findDownloadKey(),
      reason: "reinstall",
    }));
  });
}
