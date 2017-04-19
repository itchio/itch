
import * as ospath from "path";
import {app} from "electron";

import {ISessionFoldersState} from "../../types";
import * as actions from "../../actions";
import reducer from "../reducer";

const initialState = {
  libraryDir: null,
} as ISessionFoldersState;

export default reducer<ISessionFoldersState>(initialState, (on) => {
  on(actions.loginSucceeded, (state, action) => {
    const {me} = action.payload;
    const libraryDir = ospath.join(app.getPath("userData"), "users", "" + me.id);
    return {...state, libraryDir};
  });

  on(actions.logout, (state, action) => {
    return initialState;
  });
});
