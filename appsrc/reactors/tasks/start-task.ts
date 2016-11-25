
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
  store.dispatch(actions.taskStarted(Object.assign({}, {id, startedAt: Date.now()}, taskOpts)));

  let error: Error;
  let result: any;
  try {
    const out = new EventEmitter();
    out.on("progress", throttle((ev: IProgressInfo) => {
      store.dispatch(actions.taskProgress(Object.assign({}, {id}, ev)));
    }, PROGRESS_THROTTLE));

    const preferences = store.getState().preferences;
    const extendedOpts = Object.assign({}, opts, taskOpts, {
      market,
      globalMarket: getGlobalMarket(),
      credentials,
      preferences,
    });

    log(opts, `About to start ${taskOpts.name} (${id})`);
    const taskRunner = require(`../../tasks/${taskOpts.name}`).default;

    log(opts, `Starting ${taskOpts.name} (${id})...`);
    currentTasks[id] = {
      emitter: out,
    };
    result = await taskRunner(out, extendedOpts);

    log(opts, `Checking results for ${taskOpts.name} (${id})...`);
    if (result) {
      log(opts, `Task results: ${JSON.stringify(result, null, 2)}`);
    }
  } catch (e) {
    log(opts, "Task threw");
    error = e.task || e;
  } finally {
    const err = error ? error.message || ("" + error) : null;
    log(opts, `Task ended, err: ${err ? err : "<none>"}`);
    store.dispatch(actions.taskEnded({name: taskOpts.name, id, err, result, taskOpts}));
    return {err, result};
  }
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
