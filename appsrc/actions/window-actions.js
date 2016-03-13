
import {createAction} from 'redux-actions'

import {
  WINDOW_READY,
  WINDOW_DESTROYED,
  WINDOW_FOCUS_CHANGED,
  WINDOW_BOUNDS_CHANGED,
  CREATE_WINDOW,
  FOCUS_WINDOW,
  HIDE_WINDOW
} from '../constants/action-types'

export const windowReady = createAction(WINDOW_READY)
export const windowDestroyed = createAction(WINDOW_DESTROYED)
export const windowFocusChanged = createAction(WINDOW_FOCUS_CHANGED)
export const windowBoundsChanged = createAction(WINDOW_BOUNDS_CHANGED)
export const createWindow = createAction(CREATE_WINDOW)
export const focusWindow = createAction(FOCUS_WINDOW)
export const hideWindow = createAction(HIDE_WINDOW)
