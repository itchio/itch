
import {Watcher} from "../watcher";

import {EventEmitter} from "events";

import * as uuid from "uuid";
import {getUserMarket, getGlobalMarket} from "../market";

import {log, opts} from "./log";

import * as actions from "../../actions";

import {throttle} from "underscore";
const PROGRESS_THROTTLE = 50;

import {IStore, IStartTaskOpts} from "../../types";
import {IProgressInfo} from "../../types";

interface ITaskMap {
  [key: string]: {
    emitter: EventEmitter;
  };
}

let currentTasks = {} as ITaskMap;

export async function startTask (store: IStore, taskOpts: IStartTaskOpts) {
  const credentials = store.getState().session.credentials;
  const market = getUserMarket();

  const id = uuid.v4();
  store.dispatch(actions.taskStarted({id, startedAt: Date.now(), progress: 0, ...taskOpts}));

  let error: Error;
  let result: any;
  try {
    const out = new EventEmitter();
    out.on("progress", throttle((ev: IProgressInfo) => {
      store.dispatch(actions.taskProgress({id, ...ev}));
    }, PROGRESS_THROTTLE));

    const preferences = store.getState().preferences;
    const extendedOpts = {
      ...opts,
      ...taskOpts,
      market,
      globalMarket: getGlobalMarket(),
      credentials,
      preferences,
    };

    const taskRunner = require(`../../tasks/${taskOpts.name}`).default;

    log(opts, `Starting ${taskOpts.name} (${id})...`);
    currentTasks[id] = {
      emitter: out,
    };
    result = await taskRunner(out, extendedOpts);

    if (result) {
      log(opts, `${taskOpts.name} ended, result: ${JSON.stringify(result, null, 2)}`);
    } else {
      log(opts, `${taskOpts.name} ended, no result`);
    }
  } catch (e) {
    log(opts, `${taskOpts.name} threw, error: ${e.task || e}`);
    error = e.task || e;
  }

  const err = error ? (error.message || ("" + error)) : null;
  store.dispatch(actions.taskEnded({name: taskOpts.name, id, err, result, taskOpts}));
  return {err, result};
}

export default function (watcher: Watcher) {
  watcher.on(actions.abortTask, async (store, action) => {
    const {id} = action.payload;
    const task = currentTasks[id];
    if (task && task.emitter) {
      task.emitter.emit("cancel");
      delete currentTasks[id];
    }
  });
}
