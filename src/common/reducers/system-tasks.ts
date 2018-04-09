import { actions } from "common/actions";
import reducer from "./reducer";

import { ISystemTasksState } from "common/types";

const initialState = {
  nextSelfUpdateCheck: Date.now() + 60 * 1000,
  nextGameUpdateCheck: Date.now() + 30 * 1000,
} as ISystemTasksState;

export default reducer<ISystemTasksState>(initialState, on => {
  on(actions.scheduleSystemTask, (state, action) => {
    const { payload } = action;
    return {
      ...state,
      ...payload,
    };
  });
});
