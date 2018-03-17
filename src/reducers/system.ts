import * as os from "../os";
import * as app from "../helpers/app";

import { actions } from "../actions";
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
  proxy: null,
  proxySource: null,
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

  on(actions.proxySettingsDetected, (state, action) => {
    const { proxy, source } = action.payload;
    return {
      ...state,
      proxy,
      proxySource: source,
    };
  });
});
