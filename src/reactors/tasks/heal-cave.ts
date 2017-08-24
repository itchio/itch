import { Watcher } from "../watcher";
import * as actions from "../../actions";

import * as paths from "../../os/paths";

import { t } from "../../format";
import { DB } from "../../db";
import { fromJSONField } from "../../db/json-field";
import Context from "../../context";

import { IUpload } from "../../types";

import lazyGetGame from "../lazy-get-game";

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.healCave, async (store, action) => {
    const i18n = store.getState().i18n;

    const { caveId } = action.payload;
    const opts = {
      logger: paths.caveLogger(caveId),
    };

    try {
      const cave = db.caves.findOneById(caveId);
      if (!cave) {
        opts.logger.warn(`Cave not found, can't heal: ${caveId}`);
        return;
      }

      if (!cave.buildId) {
        opts.logger.warn(`Cave isn't wharf-enabled, can't heal: ${caveId}`);
        return;
      }

      const ctx = new Context(store, db);
      const game = await lazyGetGame(ctx, cave.gameId);

      const upload = {
        ...fromJSONField<IUpload>(cave.upload),
        buildId: cave.buildId,
      };

      store.dispatch(
        actions.statusMessage({
          message: t(i18n, ["status.healing"]),
        })
      );

      store.dispatch(
        actions.queueDownload({
          caveId: cave.id,
          game,
          upload,
          reason: "heal",
        })
      );
    } finally {
      opts.logger.close();
    }
  });
}
