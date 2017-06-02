
import {createAction} from "redux-actions";

import {
  FIRST_WINDOW_READY, IFirstWindowReadyPayload,
  WINDOW_READY, IWindowReadyPayload,
  WINDOW_DESTROYED, IWindowDestroyedPayload,
  WINDOW_FOCUS_CHANGED, IWindowFocusChangedPayload,
  WINDOW_FULLSCREEN_CHANGED, IWindowFullscreenChangedPayload,
  WINDOW_MAXIMIZED_CHANGED, IWindowMaximizedChangedPayload,
  WINDOW_BOUNDS_CHANGED, IWindowBoundsChangedPayload,
  CREATE_WINDOW, ICreateWindowPayload,
  FOCUS_WINDOW, IFocusWindowPayload,
  HIDE_WINDOW, IHideWindowPayload,
  MINIMIZE_WINDOW, IMinimizeWindowPayload,
  TOGGLE_MAXIMIZE_WINDOW, IToggleMaximizeWindowPayload,
  CLOSE_TAB_OR_AUX_WINDOW, ICloseTabOrAuxWindowPayload,
} from "../constants/action-types";

export const firstWindowReady = createAction<IFirstWindowReadyPayload>(FIRST_WINDOW_READY);
export const windowReady = createAction<IWindowReadyPayload>(WINDOW_READY);
export const windowDestroyed = createAction<IWindowDestroyedPayload>(WINDOW_DESTROYED);
export const windowFocusChanged = createAction<IWindowFocusChangedPayload>(WINDOW_FOCUS_CHANGED);
export const windowFullscreenChanged = createAction<IWindowFullscreenChangedPayload>(WINDOW_FULLSCREEN_CHANGED);
export const windowMaximizedChanged = createAction<IWindowMaximizedChangedPayload>(WINDOW_MAXIMIZED_CHANGED);
export const windowBoundsChanged = createAction<IWindowBoundsChangedPayload>(WINDOW_BOUNDS_CHANGED);
export const createWindow = createAction<ICreateWindowPayload>(CREATE_WINDOW);
export const focusWindow = createAction<IFocusWindowPayload>(FOCUS_WINDOW);
export const hideWindow = createAction<IHideWindowPayload>(HIDE_WINDOW);
export const toggleMaximizeWindow = createAction<IToggleMaximizeWindowPayload>(TOGGLE_MAXIMIZE_WINDOW);
export const minimizeWindow = createAction<IMinimizeWindowPayload>(MINIMIZE_WINDOW);
export const closeTabOrAuxWindow = createAction<ICloseTabOrAuxWindowPayload>(CLOSE_TAB_OR_AUX_WINDOW);
