import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { SystemTasksState } from "common/types";

const seconds = 1000;

const initialState = {
  nextComponentsUpdateCheck: Date.now() + 15 * seconds,
  nextGameUpdateCheck: Date.now() + 30 * seconds,
} as SystemTasksState;

export default reducer<SystemTasksState>(initialState, (on) => {
  on(actions.scheduleSystemTask, (state, action) => {
    const { payload } = action;
    return {
      ...state,
      ...payload,
    };
  });
});
