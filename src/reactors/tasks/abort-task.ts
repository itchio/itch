import { Watcher } from "../watcher";

import * as actions from "../../actions";

import rootLogger from "../../logger";
const logger = rootLogger.child({ name: "abort-task" });

import { getCurrentTasks } from "./as-task-persistent-state";

export default function(watcher: Watcher) {
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
