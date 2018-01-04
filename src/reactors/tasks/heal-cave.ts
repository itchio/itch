import { Watcher } from "../watcher";
import * as actions from "../../actions";

import rootLogger from "../../logger";

import { DB } from "../../db";
import { fromJSONField } from "../../db/json-field";
import Context from "../../context";

import lazyGetGame from "../lazy-get-game";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.healCave, async (store, action) => {
    const { caveId } = action.payload;
    const opts = {
      logger: rootLogger,
    };

    try {
      const cave = db.caves.findOneById(caveId);
      if (!cave) {
        opts.logger.warn(`Cave not found, can't heal: ${caveId}`);
        return;
      }

      const build = fromJSONField(cave.build);
      if (!build) {
        opts.logger.warn(`Cave isn't wharf-enabled, can't heal: ${caveId}`);
        return;
      }

      const ctx = new Context(store, db);
      const game = await lazyGetGame(ctx, cave.gameId);

      store.dispatch(
        actions.queueDownload({
          caveId: cave.id,
          game,
          upload: fromJSONField(cave.upload),
          buildId: build.id,
          reason: "heal",
        })
      );
    } finally {
      opts.logger.close();
    }
  });
}
