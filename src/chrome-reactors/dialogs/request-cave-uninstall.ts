
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import * as invariant from "invariant";

import CaveModel from "../../db/models/cave";
import fetch from "../../util/fetch";

import rootLogger from "../../logger";
const logger = rootLogger.child({name: "request-cave-uninstall"});

export default function (watcher: Watcher) {
  watcher.on(actions.requestCaveUninstall, async (store, action) => {
    const {caveId} = action.payload;
    const credentials = store.getState().session.credentials;
    const {globalMarket, market} = watcher.getMarkets();
    if (!globalMarket || !market) {
      logger.debug(`missing markets!`);
      return;
    }

    const cave = await globalMarket.getRepo(CaveModel).findOneById(caveId);
    invariant(cave, "cave to uninstall exists");

    const game = await fetch.gameLazily(market, credentials, cave.gameId);
    invariant(game, "was able to fetch game properly");
    const {title} = game;

    store.dispatch(actions.openModal({
      title: "",
      message: ["prompt.uninstall.message", {title}],
      buttons: [
        {
          label: ["prompt.uninstall.uninstall"],
          action: actions.queueCaveUninstall({caveId}),
          icon: "uninstall",
        },
        {
          label: ["prompt.uninstall.reinstall"],
          action: actions.queueCaveReinstall({caveId}),
          icon: "repeat",
        },
        "cancel",
      ],
    }));
  });
}
