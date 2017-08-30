import * as os from "../os";
import * as electron from "electron";
const app = electron.app || electron.remote.app;

import * as actions from "../actions";
import reducer from "./reducer";

import { ISystemState } from "../types";

const initialState = {
  appVersion: app.getVersion(),
  platform: os.itchPlatform(),
  osx: os.platform() === "darwin",
  macos: os.platform() === "darwin",
  windows: os.platform() === "win32",
  linux: os.platform() === "linux",
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
  booted: false,
  quitting: false,
  nextSelfUpdateCheck: Date.now() + 60 * 1000,
  nextGameUpdateCheck: Date.now() + 30 * 1000,
} as ISystemState;

export default reducer<ISystemState>(initialState, on => {
  on(actions.languageSniffed, (state, action) => {
    const sniffedLanguage = action.payload.lang;
    return {
      ...state,
      sniffedLanguage,
    };
  });

  on(actions.freeSpaceUpdated, (state, action) => {
    const { diskInfo } = action.payload;
    return {
      ...state,
      diskInfo,
    };
  });

  on(actions.proxySettingsDetected, (state, action) => {
    const { proxy, source } = action.payload;
    return {
      ...state,
      proxy,
      proxySource: source,
    };
  });

  on(actions.prepareQuit, (state, action) => {
    return {
      ...state,
      quitting: true,
    };
  });
});
