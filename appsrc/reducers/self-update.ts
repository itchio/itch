
import {handleActions} from "redux-actions";

import {ISelfUpdateState} from "../types";

import {
  IAction,
  ICheckForSelfUpdatePayload,
  ISelfUpdateAvailablePayload,
  ISelfUpdateNotAvailablePayload,
  ISelfUpdateErrorPayload,
  ISelfUpdateDownloadedPayload,
  ISnoozeSelfUpdatePayload,
  IApplySelfUpdatePayload,
  IDismissStatusPayload,
} from "../constants/action-types";

const initialState = {
  available: null,
  checking: false,
  downloading: null,
  downloaded: null,

  uptodate: false,
  error: null,
} as ISelfUpdateState;

export default handleActions<ISelfUpdateState, any>({
  CHECK_FOR_SELF_UPDATE: (state: ISelfUpdateState, action: IAction<ICheckForSelfUpdatePayload>) => {
    return Object.assign({}, state, {checking: true});
  },

  SELF_UPDATE_AVAILABLE: (state: ISelfUpdateState, action: IAction<ISelfUpdateAvailablePayload>) => {
    const {spec, downloading} = action.payload;

    const base = Object.assign({}, state, {checking: false});
    if (downloading) {
      return Object.assign({}, base, {downloading: spec});
    } else {
      return Object.assign({}, base, {available: spec});
    }
  },

  SELF_UPDATE_NOT_AVAILABLE: (state: ISelfUpdateState, action: IAction<ISelfUpdateNotAvailablePayload>) => {
    const {uptodate} = action.payload;
    return Object.assign({}, state, {checking: false, available: null, uptodate});
  },

  SELF_UPDATE_ERROR: (state: ISelfUpdateState, action: IAction<ISelfUpdateErrorPayload>) => {
    const error: string = action.payload.message;
    return Object.assign({}, state, {error, available: null, downloading: null});
  },

  SELF_UPDATE_DOWNLOADED: (state: ISelfUpdateState, action: IAction<ISelfUpdateDownloadedPayload>) => {
    const {downloading} = state;
    return Object.assign({}, state, {downloaded: downloading, downloading: null});
  },

  SNOOZE_SELF_UPDATE: (state: ISelfUpdateState, action: IAction<ISnoozeSelfUpdatePayload>) => {
    return Object.assign({}, state, {downloaded: null});
  },

  APPLY_SELF_UPDATE: (state: ISelfUpdateState, action: IAction<IApplySelfUpdatePayload>) => {
    return state;
  },

  DISMISS_STATUS: (state: ISelfUpdateState, action: IAction<IDismissStatusPayload>) => {
    return Object.assign({}, state, {error: null, uptodate: false, available: null});
  },
}, initialState);
