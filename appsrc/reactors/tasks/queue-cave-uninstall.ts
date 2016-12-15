
import {Watcher} from "../watcher";
import * as actions from "../../actions";

import {getGlobalMarket} from "../market";

import {startTask} from "./start-task";

import {ICaveRecord} from "../../types";

export default function (watcher: Watcher) {
  watcher.on(actions.queueCaveUninstall, async (store, action) => {
    const {caveId} = action.payload;

    // TODO: use state instead
    const cave = getGlobalMarket().getEntity<ICaveRecord>("caves", caveId);
    if (!cave) {
      // no such cave, can't uninstall!
      return;
    }

    const state = store.getState();
    const tasksForGame = state.tasks.tasksByGameId[cave.gameId];
    if (tasksForGame && tasksForGame.length > 0) {
      store.dispatch(actions.statusMessage({
        message: ["status.uninstall.busy", {title: cave.game.title}],
      }));
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
