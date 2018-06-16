import { actions } from "common/actions";
import reducer from "./reducer";

import { SystemTasksState } from "common/types";

const initialState = {
  nextComponentsUpdateCheck: Date.now(),
  nextGameUpdateCheck: Date.now(),
} as SystemTasksState;

export default reducer<SystemTasksState>(initialState, on => {
  on(actions.scheduleSystemTask, (state, action) => {
    const { payload } = action;
    return {
      ...state,
      ...payload,
    };
  });
});
