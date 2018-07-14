import memory from "memory-streams";

import {
  Store,
  ProgressInfo,
  isCancelled,
  TaskName,
  isAborted,
} from "common/types";
import { Context } from "main/context";
import { actions } from "common/actions";

import { Logger } from "common/logger";
import { getCurrentTasks } from "main/reactors/tasks/as-task-persistent-state";
import uuid from "common/util/uuid";
import { makeLogger, mainLogger } from "main/logger";

interface AsTaskOpts {
  store: Store;
  name: TaskName;
  gameId: number;

  /** Where the task actually performs its duty */
  work: (ctx: Context, logger: Logger) => Promise<void>;

  /** Called with the thrown error & the logs so far if set */
  onError?: (error: Error, log: string) => Promise<void>;

  onCancel?: () => Promise<void>;
}

async function asTask(opts: AsTaskOpts) {
  const id = uuid();

  const { store, name, gameId } = opts;

  const memlog = new memory.WritableStream();
  const logger = makeLogger({ customOut: memlog });

  store.dispatch(
    actions.taskStarted({
      id,
      name,
      gameId,
      startedAt: Date.now(),
    })
  );

  const ctx = new Context(store);
  ctx.registerTaskId(id);
  ctx.on("progress", (ev: ProgressInfo) => {
    store.dispatch(actions.taskProgress({ id, ...ev }));
  });

  getCurrentTasks()[id] = ctx;

  let err: Error;

  const { work, onError, onCancel } = opts;

  try {
    await work(ctx, logger);
  } catch (e) {
    err = e;
  }

  delete getCurrentTasks()[id];
  try {
    logger.close();
  } catch (e) {
    mainLogger.warn(`Couldn't close logger: ${e.stack}`);
  }

  if (err) {
    if (isCancelled(err)) {
      mainLogger.warn(`Task ${name} cancelled`);
      if (onCancel) {
        await onCancel();
      }
    } else if (isAborted(err)) {
      mainLogger.warn(`Task ${name} aborted`);
      if (onCancel) {
        await onCancel();
      }
    } else {
      mainLogger.warn(`Task ${name} threw: ${err.stack}`);
      if (onError) {
        await onError(err, memlog ? memlog.toString() : "(No log)");
      }
    }
  }

  store.dispatch(
    actions.taskEnded({
      id,
      err: err ? `${err}` : null,
    })
  );
}

export default asTask;
