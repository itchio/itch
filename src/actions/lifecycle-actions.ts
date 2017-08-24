import { createAction } from "redux-actions";

import {
  PREBOOT,
  IPrebootPayload,
  BOOT,
  IBootPayload,
  FIRST_USEFUL_PAGE,
  IFirstUsefulPagePayload,
  SETUP_STATUS,
  ISetupStatusPayload,
  SETUP_DONE,
  ISetupDonePayload,
  RETRY_SETUP,
  IRetrySetupPayload,
  PREPARE_QUIT,
  IPrepareQuitPayload,
  QUIT_WHEN_MAIN,
  IQuitWhenMainPayload,
  QUIT,
  IQuitPayload,
  QUIT_ELECTRON_APP,
  IQuitElectronAppPayload,
  QUIT_AND_INSTALL,
  IQuitAndInstallPayload,
} from "../constants/action-types";

export const preboot = createAction<IPrebootPayload>(PREBOOT);
export const boot = createAction<IBootPayload>(BOOT);
export const firstUsefulPage = createAction<IFirstUsefulPagePayload>(
  FIRST_USEFUL_PAGE
);

export const setupStatus = createAction<ISetupStatusPayload>(SETUP_STATUS);
export const setupDone = createAction<ISetupDonePayload>(SETUP_DONE);
export const retrySetup = createAction<IRetrySetupPayload>(RETRY_SETUP);

export const prepareQuit = createAction<IPrepareQuitPayload>(PREPARE_QUIT);
export const quitWhenMain = createAction<IQuitWhenMainPayload>(QUIT_WHEN_MAIN);
export const quit = createAction<IQuitPayload>(QUIT);
export const quitElectronApp = createAction<IQuitElectronAppPayload>(
  QUIT_ELECTRON_APP
);
export const quitAndInstall = createAction<IQuitAndInstallPayload>(
  QUIT_AND_INSTALL
);
