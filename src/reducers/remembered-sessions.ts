import { filter } from "underscore";

import { actions } from "../actions";
import reducer from "./reducer";

import { IRememberedSessionsState } from "../types";

const initialState = {} as IRememberedSessionsState;

export default reducer<IRememberedSessionsState>(initialState, on => {
  on(actions.sessionsRemembered, (state, action) => {
    const sessions = action.payload;
    return sessions;
  });

  on(actions.forgetSession, (state, action) => {
    const { session } = action.payload;
    return {
      ...state,
      sessions: filter(state.sessions, x => x.id != session.id),
    };
  });
});
