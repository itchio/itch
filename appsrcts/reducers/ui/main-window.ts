
import {handleActions} from "redux-actions";

import {IUIMainWindowState} from "../../types/db";

import {
  IAction,
  IWindowReadyPayload,
  IWindowDestroyedPayload,
  IPrepareQuitPayload,
  IWindowFocusChangedPayload,
  IWindowFullscreenChangedPayload,
} from "../../constants/action-types";

const initialState = {
  id: null,
  focused: false,
  fullscreen: false,
} as IUIMainWindowState;

export const mainWindow = handleActions<IUIMainWindowState, any>({
  WINDOW_READY: (state: IUIMainWindowState, action: IAction<IWindowReadyPayload>) => {
    const {id} = action.payload;
    return Object.assign({}, state, {id, focused: true});
  },

  WINDOW_DESTROYED: (state: IUIMainWindowState, action: IAction<IWindowDestroyedPayload>) => {
    return Object.assign({}, state, {id: null, focused: false});
  },

  PREPARE_QUIT: (state: IUIMainWindowState, action: IAction<IPrepareQuitPayload>) => {
    return Object.assign({}, state, {quitting: true});
  },

  WINDOW_FOCUS_CHANGED: (state: IUIMainWindowState, action: IAction<IWindowFocusChangedPayload>) => {
    const {focused} = action.payload;
    return Object.assign({}, state, {focused});
  },

  WINDOW_FULLSCREEN_CHANGED: (state: IUIMainWindowState, action: IAction<IWindowFullscreenChangedPayload>) => {
    const {fullscreen} = action.payload;
    return Object.assign({}, state, {fullscreen});
  },
}, initialState);

export default mainWindow;
