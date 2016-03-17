
export * from './notification-actions'
export * from './window-actions'
export * from './search-actions'
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
  SESSIONS_REMEMBERED,
  FORGET_SESSION,

  DB_COMMIT,
  DB_READY,
  DB_CLOSED,

  NAVIGATE,
  CLOSE_TAB,
  SHOW_PREVIOUS_TAB,
  SHOW_NEXT_TAB,
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
export const sessionsRemembered = createAction(SESSIONS_REMEMBERED)
export const forgetSession = createAction(FORGET_SESSION)

export const dbCommit = createAction(DB_COMMIT)
export const dbReady = createAction(DB_READY)
export const dbClosed = createAction(DB_CLOSED)

export const navigate = createAction(NAVIGATE)
export const closeTab = createAction(CLOSE_TAB)
export const showPreviousTab = createAction(SHOW_PREVIOUS_TAB)
export const showNextTab = createAction(SHOW_NEXT_TAB)
export const switchPage = createAction(SWITCH_PAGE)

export const prepareQuit = createAction(PREPARE_QUIT)
export const quitWhenMain = createAction(QUIT_WHEN_MAIN)
export const quit = createAction(QUIT)
export const quitElectronApp = createAction(QUIT_ELECTRON_APP)

export const reportIssue = createAction(REPORT_ISSUE)

export const checkForSelfUpdate = createAction(CHECK_FOR_SELF_UPDATE)

export const openExternal = createAction(OPEN_EXTERNAL)
