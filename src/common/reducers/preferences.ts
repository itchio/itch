import { actions } from "common/actions";
import reducer from "./reducer";

import { IPreferencesState } from "common/types";

const OFFLINE_MODE = process.env.OFFLINE_MODE === "1";

export const initialState = {
  downloadSelfUpdates: true,
  offlineMode: OFFLINE_MODE,
  installLocations: {},
  defaultInstallLocation: "appdata",
  sidebarWidth: 240,
  isolateApps: false,
  closeToTray: true,
  readyNotification: true,
  showAdvanced: false,
  openAtLogin: false,
  openAsHidden: false,
  manualGameUpdates: false,
  preventDisplaySleep: true,
  preferOptimizedPatches: false,
  disableBrowser: false,

  onlyCompatibleGames: true,
  onlyOwnedGames: false,
  onlyInstalledGames: false,
  layout: "grid",
  enableTabs: false,
} as IPreferencesState;

export default reducer<IPreferencesState>(initialState, on => {
  on(actions.updatePreferences, (state, action) => {
    const record = action.payload;
    return {
      ...state,
      ...record,
    };
  });
});
