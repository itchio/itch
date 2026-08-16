import { createStructuredSelector } from "reselect";

import { TasksState } from "common/types";

import { actions } from "common/actions";
import derivedReducer from "common/reducers/derived-reducer";
import reducer from "common/reducers/reducer";

const initialState: TasksState = {
  tasks: {},
  tasksByGameId: {},
  finishedTasks: [],
};

const baseReducer = reducer<TasksState>(initialState, (on) => {
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

    const tasks = { ...state.tasks };
    delete tasks[id];
    return {
      ...state,
      tasks,
      finishedTasks: [state.tasks[id], ...state.finishedTasks],
    };
  });
});

const selector = createStructuredSelector<
  Partial<TasksState>,
  Partial<TasksState>
>({
  tasksByGameId: (state) => {
    const result: TasksState["tasksByGameId"] = {};
    for (const task of Object.values(state.tasks ?? {})) {
      if (!result[task.gameId]) {
        result[task.gameId] = [];
      }
      result[task.gameId].push(task);
    }
    return result;
  },
});

export default derivedReducer<TasksState>(baseReducer, selector);
