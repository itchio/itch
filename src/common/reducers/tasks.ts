import { createStructuredSelector } from "reselect";

import { groupBy, omit } from "underscore";

import { ITasksState } from "common/types";

import { actions } from "common/actions";
import derivedReducer from "./derived-reducer";
import reducer from "./reducer";

const initialState = {
  tasks: {},
  finishedTasks: [],
} as ITasksState;

const baseReducer = reducer<ITasksState>(initialState, on => {
  on(actions.taskStarted, (state, action) => {
    const task = action.payload;
    return {
      ...state,
      tasks: {
        ...state.tasks,
        [task.id]: {
          ...task,
          progress: 0,
        },
      },
    };
  });

  on(actions.taskProgress, (state, action) => {
    const record = action.payload;
    const { id } = record;

    const task = state.tasks[id];
    if (!task) {
      return state;
    }

    return {
      ...state,
      tasks: {
        ...state.tasks,
        [id]: {
          ...task,
          ...record,
        },
      },
    };
  });

  on(actions.taskEnded, (state, action) => {
    const { id } = action.payload;

    return {
      ...state,
      tasks: omit(state.tasks, id),
      finishedTasks: [state.tasks[id], ...state.finishedTasks],
    };
  });
});

const selector = createStructuredSelector({
  tasksByGameId: (state: ITasksState) => groupBy(state.tasks, "gameId"),
});

export default derivedReducer(baseReducer, selector);
