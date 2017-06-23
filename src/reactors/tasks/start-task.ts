import { Watcher } from "../watcher";

import { EventEmitter } from "events";

import * as uuid from "uuid";

import * as actions from "../../actions";

import { throttle } from "underscore";
const PROGRESS_THROTTLE = 50;

import { IStore, IStartTaskOpts } from "../../types";
import { IProgressInfo } from "../../types";

import logger from "../../logger";

interface ITaskMap {
  [key: string]: {
    emitter: EventEmitter;
  };
}

let currentTasks = {} as ITaskMap;

export async function startTask(store: IStore, taskOpts: IStartTaskOpts) {
  const credentials = store.getState().session.credentials;

  const id = uuid.v4();
  store.dispatch(
    actions.taskStarted({
      id,
      startedAt: Date.now(),
      progress: 0,
      ...taskOpts,
    }),
  );

  let error: Error;
  let result: any;
  try {
    const out = new EventEmitter();
    out.on(
      "progress",
      throttle((ev: IProgressInfo) => {
        store.dispatch(actions.taskProgress({ id, ...ev }));
      }, PROGRESS_THROTTLE),
    );

    const preferences = store.getState().preferences;
    const extendedOpts = {
      ...taskOpts,
      credentials,
      preferences,
      logger,
    };

    // FIXME: no late, untyped requires
    const taskRunner = require(`../../tasks/${taskOpts.name}`).default;

    logger.info(`Starting ${taskOpts.name} (${id})...`);
    currentTasks[id] = {
      emitter: out,
    };
    result = await taskRunner(out, extendedOpts);

    if (result) {
      logger.info(
        `${taskOpts.name} ended, result: ${JSON.stringify(result, null, 2)}`,
      );
    } else {
      logger.info(`${taskOpts.name} ended, no result`);
    }
  } catch (e) {
    logger.error(`${taskOpts.name} threw, error: ${e.task || e}`);
    error = e.task || e;
  }

  const err = error ? error.message || "" + error : null;
  store.dispatch(
    actions.taskEnded({ name: taskOpts.name, id, err, result, taskOpts }),
  );
  return { err, result };
}

export default function(watcher: Watcher) {
  watcher.on(actions.abortTask, async (store, action) => {
    const { id } = action.payload;
    const task = currentTasks[id];
    if (task && task.emitter) {
      task.emitter.emit("cancel");
      // TODO: investigate not all tasks are cancellable, deleting
      // them from currentTasks seems rash
      delete currentTasks[id];
    }
  });
}
