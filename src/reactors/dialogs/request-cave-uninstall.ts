
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import * as invariant from "invariant";

import db from "../../db";
import CaveModel from "../../db/models/cave";
import fetch from "../../util/fetch";

export default function (watcher: Watcher) {
  watcher.on(actions.requestCaveUninstall, async (store, action) => {
    const {caveId} = action.payload;
    const credentials = store.getState().session.credentials;

    const cave = await db.getRepo(CaveModel).findOneById(caveId);
    invariant(cave, "cave to uninstall exists");

    const game = await fetch.gameLazily(credentials, cave.gameId);
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
