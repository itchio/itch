import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { PreferencesState } from "common/types";
import env from "common/env";

const OFFLINE_MODE = process.env.OFFLINE_MODE === "1";

export const initialState: PreferencesState = {
  downloadSelfUpdates: true,
  offlineMode: OFFLINE_MODE,
  installLocations: {},
  defaultInstallLocation: "appdata",
  isolateApps: false,
  closeToTray: true,
  readyNotification: true,
  showAdvanced: false,
  lang: undefined,
  gotMinimizeNotification: false,
  openAtLogin: false,
  openAsHidden: false,
  manualGameUpdates: false,
  preventDisplaySleep: true,
  preferOptimizedPatches: false,
  layout: "grid",
  disableBrowser: env.integrationTests ? true : false,
  disableHardwareAcceleration: false,
  enableTabs: false,
  lastSuccessfulSetupVersion: undefined,
  importedOldInstallLocations: false,
  recentPushFolders: [],
};

export const MAX_RECENT_PUSH_FOLDERS = 5;

export default reducer<PreferencesState>(initialState, (on) => {
  on(actions.updatePreferences, (state, action) => {
    const record = action.payload;
    return {
      ...state,
      ...record,
    };
  });
});
