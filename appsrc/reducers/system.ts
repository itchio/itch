
import os from "../util/os";
import {app} from "../electron";
import {handleActions} from "redux-actions";

import {
  IAction,
  ILanguageSniffedPayload,
  IFreeSpaceUpdatedPayload,
} from "../constants/action-types";

import {ISystemState} from "../types";

const initialState = {
  appVersion: app.getVersion(),
  osx: (os.platform() === "darwin"),
  macos: (os.platform() === "darwin"),
  windows: (os.platform() === "win32"),
  linux: (os.platform() === "linux"),
  sniffedLanguage: null,
  homePath: app.getPath("home"),
  userDataPath: app.getPath("userData"),
  diskInfo: {
    parts: [],
    total: {
      free: 0,
      size: 0,
    },
  },
} as ISystemState;

export default handleActions<ISystemState, any>({
  LANGUAGE_SNIFFED: (state: ISystemState, action: IAction<ILanguageSniffedPayload>) => {
    const sniffedLanguage: string = action.payload.lang;
    return Object.assign({}, state, {sniffedLanguage});
  },

  FREE_SPACE_UPDATED: (state: ISystemState, action: IAction<IFreeSpaceUpdatedPayload>) => {
    const {diskInfo} = action.payload;
    return Object.assign({}, state, {diskInfo});
  },
}, initialState);
