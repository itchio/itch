
import * as actions from "../../actions";

import {sortBy} from "underscore";

import {
  IStore,
} from "../../types";

import {
  IAction,
  IAbortLastGamePayload,
  IAbortGamePayload,
} from "../../constants/action-types";

export async function abortLastGame (store: IStore, action: IAction<IAbortLastGamePayload>) {
  const tasks = sortBy(store.getState().tasks.tasks, "startedAt");

  if (tasks.length > 0) {
    const task = tasks[0];
    store.dispatch(actions.abortTask({id: task.id}));
  }
}

export async function abortGame (store: IStore, action: IAction<IAbortGamePayload>) {
  const {gameId} = action.payload;

  const {tasks} = store.getState().tasks;

  for (const taskId of Object.keys(tasks)) {
    const task = tasks[taskId];
    if (task.gameId === gameId && task.name === "launch") {
      store.dispatch(actions.abortTask({id: task.id}));
    }
  }
}
