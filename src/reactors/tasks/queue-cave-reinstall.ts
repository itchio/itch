
import {EventEmitter} from "events";

import {Watcher} from "../watcher";
import * as actions from "../../actions";

import db from "../../db";

import findUploads from "../downloads/find-uploads";
import getGameCredentials from "../downloads/get-game-credentials";
import lazyGetGame from "../lazy-get-game";

export default function (watcher: Watcher) {
  watcher.on(actions.queueCaveReinstall, async (store, action) => {
    const {caveId} = action.payload;

    const cave = await db.caves.findOneById(caveId);
    if (!cave) {
      // can't reinstall without a valid cave!
      return;
    }

    const game = await lazyGetGame(store, cave.gameId);
    if (!game) {
      // no valid game
      return;
    }

    const gameCredentials = await getGameCredentials(store, game);
    if (!gameCredentials) {
      // no credentials
      return;
    }

    const out = new EventEmitter();

    const uploadResponse = await findUploads(out, {
      game,
      gameCredentials,
    });
    if (!uploadResponse) {
      // couldn't find an upload
      return;
    }

    // FIXME: what if there's several uploads to pick from (but not
    // the original?)
    // FIXME: what about trying to maintain the original?
    const {uploads} = uploadResponse;
    if (uploads.length < 1) {
      return;
    }
    const upload = uploads[0];

    // FIXME: this is bad.
    const state = store.getState();
    const tasksForGame = state.tasks.tasksByGameId[cave.gameId];
    if (tasksForGame && tasksForGame.length > 0) {
      store.dispatch(actions.statusMessage({
        message: ["status.reinstall.busy", {title: cave.game.title}],
      }));
      return;
    }

    store.dispatch(actions.queueDownload({
      game,
      upload,
      totalSize: upload.size,
      reason: "reinstall",
    }));
  });
}
