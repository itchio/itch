
import {handleActions} from "redux-actions";

import {
  IAction,
  IUpdatePreferencesPayload,
} from "../constants/action-types";

import {IPreferencesState} from "../types";

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
} as IPreferencesState;

export default handleActions<IPreferencesState, any>({
  UPDATE_PREFERENCES: (state: IPreferencesState, action: IAction<IUpdatePreferencesPayload>) => {
    const record = action.payload;
    return Object.assign({}, state, record);
  },
}, initialState);
