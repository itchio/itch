import { actions } from "common/actions";
import reducer from "./reducer";

import { ISystemTasksState } from "common/types";

const initialState = {
  nextComponentsUpdateCheck: Date.now(),
  nextGameUpdateCheck: Date.now(),
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
