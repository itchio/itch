
import {handleActions} from "redux-actions";

import {ISessionCredentialsState} from "../../types";

import {
  IAction,
  ILoginSucceededPayload,
  ILogoutPayload,
} from "../../constants/action-types";

const initialState = {
  key: null,
  me: null,
} as ISessionCredentialsState;

export default handleActions<ISessionCredentialsState, any>({
  LOGIN_SUCCEEDED: (state: ISessionCredentialsState, action: IAction<ILoginSucceededPayload>) => {
    const {key, me} = action.payload;
    return Object.assign({}, state, {key, me});
  },

  LOGOUT: (state: ISessionCredentialsState, action: IAction<ILogoutPayload>) => {
    return Object.assign({}, state, {key: null, me: null});
  },
}, initialState);
