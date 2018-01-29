import { Watcher } from "../watcher";
import { actions } from "../../actions";

import rootLogger from "../../logger";

import { DB } from "../../db";
import Context from "../../context";

import lazyGetGame from "../lazy-get-game";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.healCave, async (store, action) => {
    const { caveId } = action.payload;

    const cave = db.caves.findOneById(caveId);
    if (!cave) {
      rootLogger.warn(`Cave not found, can't heal: ${caveId}`);
      return;
    }

    const { upload, build } = cave;
    if (!upload) {
      rootLogger.warn(`Cave doesn't have upload, can't heal: ${caveId}`);
      return;
    }
    if (!build) {
      rootLogger.warn(`Cave isn't wharf-enabled, can't heal: ${caveId}`);
      return;
    }

    const ctx = new Context(store, db);
    const game = await lazyGetGame(ctx, cave.gameId);

    store.dispatch(
      actions.queueDownload({
        caveId: cave.id,
        game,
        upload,
        build,
        reason: "heal",
      })
    );
  });
}
