
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import * as invariant from "invariant";

import fetch from "../../util/fetch";

import {ICaveRecord} from "../../types";

// ¯\_(ツ)_/¯
// TODO: use market state instead
import {getGlobalMarket, getUserMarket} from "../../reactors/market";

export default function (watcher: Watcher) {
  watcher.on(actions.requestCaveUninstall, async (store, action) => {
    const {caveId} = action.payload;
    const credentials = store.getState().session.credentials;
    const globalMarket = getGlobalMarket();
    const userMarket = getUserMarket();

    const cave = globalMarket.getEntity<ICaveRecord>("caves", caveId);
    invariant(cave, "cave to uninstall exists");

    const game = await fetch.gameLazily(userMarket, credentials, cave.gameId, {game: cave.game});
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
