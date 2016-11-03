
import * as invariant from "invariant";
import {omit} from "underscore";
import {handleActions} from "redux-actions";

import {
  IAction,
  ISessionsRememberedPayload,
  ISessionUpdatedPayload,
  IForgetSessionPayload,
} from "../constants/action-types";

import {IRememberedSessionsState} from "../types/db";

const initialState = {} as IRememberedSessionsState;

export default handleActions<IRememberedSessionsState, any>({
  SESSIONS_REMEMBERED: (state: IRememberedSessionsState, action: IAction<ISessionsRememberedPayload>) => {
    const sessions = action.payload;
    return sessions;
  },

  SESSION_UPDATED: (state: IRememberedSessionsState, action: IAction<ISessionUpdatedPayload>) => {
    const {id, record} = action.payload;
    const session = state[id] || {};
    return Object.assign({}, state, {
      [id]: Object.assign({}, session, record),
    });
  },

  FORGET_SESSION: (state: IRememberedSessionsState, action: IAction<IForgetSessionPayload>) => {
    const {id} = action.payload;
    invariant(typeof id !== "undefined", "forgetting session from a valid userId");
    return omit(state, id);
  },
}, initialState);
