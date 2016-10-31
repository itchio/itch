
import {createAction} from "redux-actions";

import {
  SESSION_READY,
  SESSIONS_REMEMBERED,
  SESSION_UPDATED,
  FORGET_SESSION_REQUEST,
  FORGET_SESSION,
} from "../constants/action-types";

export const sessionReady = createAction(SESSION_READY);
export const sessionsRemembered = createAction(SESSIONS_REMEMBERED);
export const sessionUpdated = createAction(SESSION_UPDATED);
export const forgetSessionRequest = createAction(FORGET_SESSION_REQUEST);
export const forgetSession = createAction(FORGET_SESSION);
