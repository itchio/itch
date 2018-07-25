import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { PreferencesState } from "common/types";

const OFFLINE_MODE = process.env.OFFLINE_MODE === "1";

export const initialState = {
  downloadSelfUpdates: true,
  offlineMode: OFFLINE_MODE,
  installLocations: {},
  defaultInstallLocation: "appdata",
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

  layout: "grid",
  enableTabs: false,
} as PreferencesState;

export default reducer<PreferencesState>(initialState, on => {
  on(actions.updatePreferences, (state, action) => {
    const record = action.payload;
    return {
      ...state,
      ...record,
    };
  });
});
