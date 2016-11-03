
import {handleActions} from "redux-actions";

import {ISessionLoginState} from "../../types/db";

import {
  IAction,
  IAttemptLoginPayload,
  ILoginStartPickingPayload,
  ILoginStopPickingPayload,
  ILoginFailedPayload,
  ILoginSucceededPayload,
  ILogoutPayload,
} from "../../constants/action-types";

const initialState = {
  picking: true,
  errors: [],
  blockingOperation: null,
} as ISessionLoginState;

export default handleActions<ISessionLoginState, any>({
  ATTEMPT_LOGIN: (state: ISessionLoginState, action: IAction<IAttemptLoginPayload>) => {
    return Object.assign({}, state, {
      errors: [],
      blockingOPeration: {
        icon: "heart-filled",
        message: ["login.status.login"],
      },
    });
  },

  LOGIN_START_PICKING: (state: ISessionLoginState, action: IAction<ILoginStartPickingPayload>) => {
    return Object.assign({}, state, {picking: true});
  },

  LOGIN_STOP_PICKING: (state: ISessionLoginState, action: IAction<ILoginStopPickingPayload>) => {
    return Object.assign({}, state, {picking: false});
  },

  LOGIN_FAILED: (state: ISessionLoginState, action: IAction<ILoginFailedPayload>) => {
    const {errors} = action.payload;
    // set picking to false because if we were trying a key login, we probably want
    // to re-enter the password to see if we can obtain a new API token
    return Object.assign({}, initialState, {
      errors,
      blockingOperation: null,
      picking: false,
    });
  },

  LOGIN_SUCCEEDED: (state: ISessionLoginState, action: IAction<ILoginSucceededPayload>) => {
    return initialState;
  },

  LOGOUT: (state: ISessionLoginState, action: IAction<ILogoutPayload>) => {
    return initialState;
  },
}, initialState);
