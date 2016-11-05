
import {handleActions} from "redux-actions";
import * as ospath from "path";
import {app} from "../../electron";

import {ISessionFoldersState} from "../../types";

import {
  IAction, ILoginSucceededPayload, ILogoutPayload,
} from "../../constants/action-types";

const initialState = {
  libraryDir: null,
} as ISessionFoldersState;

export default handleActions<ISessionFoldersState, any>({
  LOGIN_SUCCEEDED: (state: ISessionFoldersState, action: IAction<ILoginSucceededPayload>) => {
    const {me} = action.payload;
    const libraryDir = ospath.join(app.getPath("userData"), "users", "" + me.id);
    return Object.assign({}, state, {libraryDir});
  },

  LOGOUT: (state: ISessionFoldersState, action: IAction<ILogoutPayload>) => {
    return initialState;
  },
}, initialState);
