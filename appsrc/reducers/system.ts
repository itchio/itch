
import os from "../util/os";
import {app} from "../electron";
import {handleActions} from "redux-actions";

import {
  IAction,
  ILanguageSniffedPayload,
  IFreeSpaceUpdatedPayload,
  IProxySettingsDetectedPayload,
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
  proxy: null,
  proxySource: null,
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

  PROXY_SETTINGS_DETECTED: (state: ISystemState, action: IAction<IProxySettingsDetectedPayload>) => {
    const proxy: string = action.payload.proxy;
    const proxySource: string = action.payload.source;
    return Object.assign({}, state, {proxy, proxySource});
  },
}, initialState);
