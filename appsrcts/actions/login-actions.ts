
import {createAction} from "redux-actions";

import {
  LOGIN_START_PICKING,
  LOGIN_STOP_PICKING,

  ATTEMPT_LOGIN,
  LOGIN_WITH_PASSWORD,
  LOGIN_WITH_TOKEN,
  LOGIN_FAILED,
  LOGIN_SUCCEEDED,

  CHANGE_USER,
  LOGOUT,
} from "../constants/action-types";

export const loginStartPicking = createAction(LOGIN_START_PICKING);
export const loginStopPicking = createAction(LOGIN_STOP_PICKING);

export const attemptLogin = createAction(ATTEMPT_LOGIN);
export const loginWithPassword = createAction(LOGIN_WITH_PASSWORD);
export const loginWithToken = createAction(LOGIN_WITH_TOKEN);
export const loginFailed = createAction(LOGIN_FAILED);
export const loginSucceeded = createAction(LOGIN_SUCCEEDED);

export const changeUser = createAction(CHANGE_USER);
export const logout = createAction(LOGOUT);
