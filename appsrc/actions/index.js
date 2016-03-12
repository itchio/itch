
export * from './locale-actions'
export * from './login-actions'
export * from './menu-actions'

import {createAction} from 'redux-actions'

import {
  OPERATION_FAILED,

  BOOT,
  OPEN_URL,

  LANGUAGE_SNIFFED,
  LANGUAGE_CHANGED,

  SETUP_STATUS,
  SETUP_DONE,

  SESSION_READY,

  WINDOW_READY,
  WINDOW_DESTROYED,
  WINDOW_FOCUS_CHANGED,
  CREATE_WINDOW,
  FOCUS_WINDOW,
  HIDE_WINDOW,

  NAVIGATE,
  SWITCH_PAGE,

  PREPARE_QUIT,
  QUIT_WHEN_MAIN,
  QUIT,
  QUIT_ELECTRON_APP,

  REPORT_ISSUE,

  CHECK_FOR_SELF_UPDATE,

  OPEN_EXTERNAL
} from '../constants/action-types'

export const operationFailed = createAction(OPERATION_FAILED)

export const boot = createAction(BOOT)
export const openUrl = createAction(OPEN_URL)

export const languageSniffed = createAction(LANGUAGE_SNIFFED)
export const languageChanged = createAction(LANGUAGE_CHANGED)

export const setupStatus = createAction(SETUP_STATUS)
export const setupDone = createAction(SETUP_DONE)

export const sessionReady = createAction(SESSION_READY)

export const windowReady = createAction(WINDOW_READY)
export const windowDestroyed = createAction(WINDOW_DESTROYED)
export const windowFocusChanged = createAction(WINDOW_FOCUS_CHANGED)
export const createWindow = createAction(CREATE_WINDOW)
export const focusWindow = createAction(FOCUS_WINDOW)
export const hideWindow = createAction(HIDE_WINDOW)

export const navigate = createAction(NAVIGATE)
export const switchPage = createAction(SWITCH_PAGE)

export const prepareQuit = createAction(PREPARE_QUIT)
export const quitWhenMain = createAction(QUIT_WHEN_MAIN)
export const quit = createAction(QUIT)
export const quitElectronApp = createAction(QUIT_ELECTRON_APP)

export const reportIssue = createAction(REPORT_ISSUE)

export const checkForSelfUpdate = createAction(CHECK_FOR_SELF_UPDATE)

export const openExternal = createAction(OPEN_EXTERNAL)
