
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {getGlobalMarket} from "../market";

import {startTask} from "./start-task";

export default function (watcher: Watcher) {
  watcher.on(actions.queueCaveUninstall, async (store, action) => {
    const {caveId} = action.payload;

    // TODO: use state instead
    const cave = getGlobalMarket().getEntity("caves", caveId);
    if (!cave) {
      // no such cave, can't uninstall!
      return;
    }

    await startTask(store, {
      name: "uninstall",
      gameId: cave.gameId,
      cave,
    });

    store.dispatch(actions.clearGameDownloads({gameId: cave.gameId}));
  });
}
