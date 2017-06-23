import { Watcher } from "../watcher";
import * as actions from "../../actions";

import { startTask } from "./start-task";

export default function(watcher: Watcher) {
  watcher.on(actions.queueCaveUninstall, async (store, action) => {
    const { caveId } = action.payload;

    // FIXME: db
    const globalMarket: any = null;
    const cave = globalMarket.getEntity("caves", caveId);
    if (!cave) {
      // no such cave, can't uninstall!
      return;
    }

    const state = store.getState();
    const tasksForGame = state.tasks.tasksByGameId[cave.gameId];
    if (tasksForGame && tasksForGame.length > 0) {
      store.dispatch(
        actions.statusMessage({
          message: ["status.uninstall.busy", { title: cave.game.title }],
        }),
      );
      return;
    }

    await startTask(store, {
      name: "uninstall",
      gameId: cave.gameId,
      cave,
    });

    store.dispatch(actions.clearGameDownloads({ gameId: cave.gameId }));
  });
}
