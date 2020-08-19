import { actions } from "common/actions";
import { Watcher } from "common/util/watcher";
import { mainLogger } from "main/logger";
import { getCurrentTasks } from "main/reactors/tasks/as-task-persistent-state";

const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
  watcher.on(actions.abortTask, async (store, action) => {
    const { id } = action.payload;
    const ctx = getCurrentTasks()[id];
    if (ctx) {
      try {
        await ctx.tryAbort();
      } catch (e) {
        logger.warn(`Could not cancel task ${id}: ${e.stack}`);
      }
    }
  });
}
