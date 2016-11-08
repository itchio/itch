
import {createAction} from "redux-actions";

import {
  SESSION_READY, ISessionReadyPayload,
  SESSIONS_REMEMBERED, ISessionsRememberedPayload,
  SESSION_UPDATED, ISessionUpdatedPayload,
  FORGET_SESSION_REQUEST, IForgetSessionRequestPayload,
  FORGET_SESSION, IForgetSessionPayload,
} from "../constants/action-types";

export const sessionReady = createAction<ISessionReadyPayload>(SESSION_READY);
export const sessionsRemembered = createAction<ISessionsRememberedPayload>(SESSIONS_REMEMBERED);
export const sessionUpdated = createAction<ISessionUpdatedPayload>(SESSION_UPDATED);
export const forgetSessionRequest = createAction<IForgetSessionRequestPayload>(FORGET_SESSION_REQUEST);
export const forgetSession = createAction<IForgetSessionPayload>(FORGET_SESSION);
