import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import { sortBy } from "underscore";

export default function (watcher: Watcher) {
  watcher.on(actions.forceCloseLastGame, async (store, action) => {
    const tasks = sortBy(store.getState().tasks.tasks, "startedAt");

    if (tasks.length > 0) {
      const task = tasks[0];
      store.dispatch(actions.abortTask({ id: task.id }));
    }
  });

  watcher.on(actions.forceCloseGame, async (store, action) => {
    const { gameId } = action.payload;

    const { tasks } = store.getState().tasks;

    for (const taskId of Object.keys(tasks)) {
      const task = tasks[taskId];
      if (task.gameId === gameId && task.name === "launch") {
        store.dispatch(actions.abortTask({ id: task.id }));
      }
    }
  });
}
