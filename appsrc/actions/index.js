
import {createAction} from 'redux-actions'

import {
  BOOT,
  OPEN_URL,

  WINDOW_READY,
  WINDOW_FOCUS_CHANGED,
  CREATE_WINDOW,
  FOCUS_WINDOW,
  HIDE_WINDOW,

  FOCUS_PANEL,

  PREPARE_QUIT,
  QUIT_WHEN_MAIN,
  QUIT,
  QUIT_ELECTRON_APP
} from '../constants/action-types'

export const boot = createAction(BOOT)
export const openUrl = createAction(OPEN_URL)

export const windowReady = createAction(WINDOW_READY)
export const windowFocusChanged = createAction(WINDOW_FOCUS_CHANGED)
export const createWindow = createAction(CREATE_WINDOW)
export const focusWindow = createAction(FOCUS_WINDOW)
export const hideWindow = createAction(HIDE_WINDOW)

export const focusPanel = createAction(FOCUS_PANEL)

export const prepareQuit = createAction(PREPARE_QUIT)
export const quitWhenMain = createAction(QUIT_WHEN_MAIN)
export const quit = createAction(QUIT)
export const quitElectronApp = createAction(QUIT_ELECTRON_APP)
