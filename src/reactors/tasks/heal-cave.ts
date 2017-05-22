
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import * as paths from "../../os/paths";

import {findWhere} from "underscore";

import localizer from "../../localizer";

export default function (watcher: Watcher) {
  watcher.on(actions.healCave, async (store, action) => {
    const i18n = store.getState().i18n;
    const t = localizer.getT(i18n.strings, i18n.lang);

    const {caveId} = action.payload;
    const opts = {
      logger: paths.caveLogger(caveId),
    };

    try {
      // FIXME: db
      const globalMarket: any = null;

      const cave = globalMarket.getEntity("caves", caveId);
      if (!cave) {
        opts.logger.warn(`Cave not found, can't heal: ${caveId}`);
        return;
      }

      if (!cave.buildId) {
        opts.logger.warn(`Cave isn't wharf-enabled, can't heal: ${caveId}`);
        return;
      }

      let upload = cave.uploads[cave.uploadId];
      upload = {
        ...upload,
        buildId: cave.buildId,
      };

      const market: any = null;

      const downloadKey = cave.downloadKey ||
        findWhere(market.getEntities("downloadKeys"), {gameId: cave.game.id});

      store.dispatch(actions.statusMessage({
        message: t("status.healing"),
      }));

      store.dispatch(actions.queueDownload({
        cave: cave,
        game: cave.game,
        upload,
        downloadKey,
        reason: "heal",
        destPath: null,
        heal: true,
      }));
    } finally {
      opts.logger.close();
    }
  });
}
