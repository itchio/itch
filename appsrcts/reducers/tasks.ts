
import {handleActions} from "redux-actions";
import {createStructuredSelector} from "reselect";

import * as invariant from "invariant";
import {values, groupBy, omit} from "underscore";

import {ITasksState} from "../types/db";

import derivedReducer from "./derived-reducer";

import {
  IAction,
  ITaskStartedPayload,
  ITaskProgressPayload,
  ITaskEndedPayload,
} from "../constants/action-types";

const initialState = {
  tasks: {},
  finishedTasks: [],
} as ITasksState;

const reducer = handleActions<ITasksState, any>({
  TASK_STARTED: (state: ITasksState, action: IAction<ITaskStartedPayload>) => {
    const {tasks} = state;
    const task = action.payload;
    invariant(task.id, "valid task id in started");
    const newTasks = Object.assign({}, tasks, {
      [task.id]: task,
    });
    return Object.assign({}, state, {tasks: newTasks});
  },

  TASK_PROGRESS: (state: ITasksState, action: IAction<ITaskProgressPayload>) => {
    const {tasks} = state;
    const record = action.payload;
    const {id} = record;

    const task = tasks[id];
    const newTasks = Object.assign({}, tasks, {
      [id]: Object.assign({}, task, record),
    });
    return Object.assign({}, state, {tasks: newTasks});
  },

  TASK_ENDED: (state: ITasksState, action: IAction<ITaskEndedPayload>) => {
    const {id} = action.payload;

    const {tasks, finishedTasks} = state;
    const newTasks = omit(tasks, id);
    const newFinishedTasks = [tasks[id], ...finishedTasks];

    return Object.assign({}, state, {
      tasks: newTasks,
      finishedTasks: newFinishedTasks,
    });
  },
}, initialState);

const selector = createStructuredSelector({
  tasksByGameId: (state: ITasksState) => groupBy(values(state.tasks), "gameId"),
});

export default derivedReducer(reducer, selector);
