import { Watcher } from "../watcher";
import * as actions from "../../actions";

import getGameCredentials from "../downloads/get-game-credentials";
import lazyGetGame from "../lazy-get-game";

import Context from "../../context";
import { DB } from "../../db";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.queueCaveReinstall, async (store, action) => {
    const { caveId } = action.payload;

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      // can't reinstall without a valid cave!
      return;
    }

    const ctx = new Context(store, db);

    const game = await lazyGetGame(ctx, cave.gameId);
    if (!game) {
      // no valid game
      return;
    }

    const gameCredentials = await getGameCredentials(ctx, game);
    if (!gameCredentials) {
      // no credentials
      return;
    }

    const { upload, build } = cave;

    // FIXME: this is bad - ideally butler would ask for a lock
    // on the game's folder, and itch would handle those.
    const state = store.getState();
    const tasksForGame = state.tasks.tasksByGameId[cave.gameId];
    if (tasksForGame && tasksForGame.length > 0) {
      store.dispatch(
        actions.statusMessage({
          message: ["status.reinstall.busy", { title: game.title }],
        })
      );
      return;
    }

    store.dispatch(
      actions.queueDownload({
        game,
        caveId,
        upload,
        build,
        reason: "reinstall",
      })
    );
  });
}
