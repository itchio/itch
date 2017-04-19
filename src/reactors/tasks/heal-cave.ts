
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {getUserMarket, getGlobalMarket} from "../market";
import pathmaker from "../../util/pathmaker";
import mklog from "../../util/log";
const log = mklog("revert-cave");

import {ICaveRecord, IDownloadKey} from "../../types";
import {findWhere} from "underscore";

import localizer from "../../localizer";

export default function (watcher: Watcher) {
  watcher.on(actions.healCave, async (store, action) => {
    const i18n = store.getState().i18n;
    const t = localizer.getT(i18n.strings, i18n.lang);

    const {caveId} = action.payload;
    const logger = pathmaker.caveLogger(caveId);
    const opts = {
      logger,
    };

    try {
      const globalMarket = getGlobalMarket();

      const cave = globalMarket.getEntity<ICaveRecord>("caves", caveId);
      if (!cave) {
        log(opts, `Cave not found, can't heal: ${caveId}`);
        return;
      }

      if (!cave.buildId) {
        log(opts, `Cave isn't wharf-enabled, can't heal: ${caveId}`);
        return;
      }

      let upload = cave.uploads[cave.uploadId];
      upload = {
        ...upload,
        buildId: cave.buildId,
      };

      const market = getUserMarket();

      const downloadKey = cave.downloadKey ||
        findWhere(market.getEntities<IDownloadKey>("downloadKeys"), {gameId: cave.game.id});

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
      logger.close();
    }
  });
}
