import { omit } from "underscore";

import * as actions from "../actions";
import reducer from "./reducer";

import { IRememberedSessionsState } from "../types";

const initialState = {} as IRememberedSessionsState;

export default reducer<IRememberedSessionsState>(initialState, on => {
  on(actions.sessionsRemembered, (state, action) => {
    const sessions = action.payload;
    return sessions;
  });

  on(actions.sessionUpdated, (state, action) => {
    const { id, record } = action.payload;
    return {
      ...state,
      [id]: {
        ...state[id] || {},
        ...record,
      },
    };
  });

  on(actions.forgetSession, (state, action) => {
    const { id } = action.payload;
    return omit(state, "" + id);
  });
});
