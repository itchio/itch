
import {createAction} from 'redux-actions'

import {
  PREBOOT,
  BOOT,
  FIRST_USEFUL_PAGE,

  SETUP_STATUS,
  SETUP_DONE,
  RETRY_SETUP,

  PREPARE_QUIT,
  QUIT_WHEN_MAIN,
  QUIT,
  QUIT_ELECTRON_APP,
  QUIT_AND_INSTALL
} from '../constants/action-types'

export const preboot = createAction(PREBOOT)
export const boot = createAction(BOOT)
export const firstUsefulPage = createAction(FIRST_USEFUL_PAGE)

export const setupStatus = createAction(SETUP_STATUS)
export const setupDone = createAction(SETUP_DONE)
export const retrySetup = createAction(RETRY_SETUP)

export const prepareQuit = createAction(PREPARE_QUIT)
export const quitWhenMain = createAction(QUIT_WHEN_MAIN)
export const quit = createAction(QUIT)
export const quitElectronApp = createAction(QUIT_ELECTRON_APP)
export const quitAndInstall = createAction(QUIT_AND_INSTALL)
