import { createAction } from "redux-actions";

import {
  QUEUE_GAME,
  IQueueGamePayload,
  QUEUE_LAUNCH,
  IQueueLaunchPayload,
  QUEUE_INSTALL,
  IQueueInstallPayload,
  PROBE_CAVE,
  IProbeCavePayload,
  EXPLORE_CAVE,
  IExploreCavePayload,
  REPORT_CAVE,
  IReportCavePayload,
  REQUEST_CAVE_UNINSTALL,
  IRequestCaveUninstallPayload,
  QUEUE_CAVE_UNINSTALL,
  IQueueCaveUninstallPayload,
  QUEUE_CAVE_REINSTALL,
  IQueueCaveReinstallPayload,
  INITIATE_PURCHASE,
  IInitiatePurchasePayload,
  PURCHASE_COMPLETED,
  IPurchaseCompletedPayload,
  ENCOURAGE_GENEROSITY,
  IEncourageGenerosityPayload,
  ABORT_GAME_REQUEST,
  IAbortGameRequestPayload,
  ABORT_LAST_GAME,
  IAbortLastGamePayload,
  ABORT_GAME,
  IAbortGamePayload,
  CHECK_FOR_GAME_UPDATE,
  ICheckForGameUpdatePayload,
  CHECK_FOR_GAME_UPDATES,
  ICheckForGameUpdatesPayload,
  GAME_UPDATE_AVAILABLE,
  IGameUpdateAvailablePayload,
  SHOW_GAME_UPDATE,
  IShowGameUpdatePayload,
  QUEUE_GAME_UPDATE,
  IQueueGameUpdatePayload,
  NUKE_CAVE_PREREQS,
  INukeCavePrereqsPayload,
  CONFIGURE_CAVE,
  IConfigureCavePayload,
  REVERT_CAVE_REQUEST,
  IRevertCaveRequestPayload,
  HEAL_CAVE,
  IHealCavePayload,
  VIEW_CAVE_DETAILS,
  IViewCaveDetailsPayload,
} from "../constants/action-types";

export const queueGame = createAction<IQueueGamePayload>(QUEUE_GAME);
export const queueLaunch = createAction<IQueueLaunchPayload>(QUEUE_LAUNCH);
export const queueInstall = createAction<IQueueInstallPayload>(QUEUE_INSTALL);

export const probeCave = createAction<IProbeCavePayload>(PROBE_CAVE);
export const exploreCave = createAction<IExploreCavePayload>(EXPLORE_CAVE);
export const reportCave = createAction<IReportCavePayload>(REPORT_CAVE);
export const requestCaveUninstall = createAction<IRequestCaveUninstallPayload>(
  REQUEST_CAVE_UNINSTALL,
);
export const queueCaveUninstall = createAction<IQueueCaveUninstallPayload>(
  QUEUE_CAVE_UNINSTALL,
);
export const queueCaveReinstall = createAction<IQueueCaveReinstallPayload>(
  QUEUE_CAVE_REINSTALL,
);
export const initiatePurchase = createAction<IInitiatePurchasePayload>(
  INITIATE_PURCHASE,
);
export const encourageGenerosity = createAction<IEncourageGenerosityPayload>(
  ENCOURAGE_GENEROSITY,
);
export const purchaseCompleted = createAction<IPurchaseCompletedPayload>(
  PURCHASE_COMPLETED,
);

export const abortGameRequest = createAction<IAbortGameRequestPayload>(
  ABORT_GAME_REQUEST,
);
export const abortLastGame = createAction<IAbortLastGamePayload>(
  ABORT_LAST_GAME,
);
export const abortGame = createAction<IAbortGamePayload>(ABORT_GAME);

export const checkForGameUpdate = createAction<ICheckForGameUpdatePayload>(
  CHECK_FOR_GAME_UPDATE,
);
export const checkForGameUpdates = createAction<ICheckForGameUpdatesPayload>(
  CHECK_FOR_GAME_UPDATES,
);
export const gameUpdateAvailable = createAction<IGameUpdateAvailablePayload>(
  GAME_UPDATE_AVAILABLE,
);
export const showGameUpdate = createAction<IShowGameUpdatePayload>(
  SHOW_GAME_UPDATE,
);
export const queueGameUpdate = createAction<IQueueGameUpdatePayload>(
  QUEUE_GAME_UPDATE,
);

export const nukeCavePrereqs = createAction<INukeCavePrereqsPayload>(
  NUKE_CAVE_PREREQS,
);
export const configureCave = createAction<IConfigureCavePayload>(
  CONFIGURE_CAVE,
);
export const revertCaveRequest = createAction<IRevertCaveRequestPayload>(
  REVERT_CAVE_REQUEST,
);
export const healCave = createAction<IHealCavePayload>(HEAL_CAVE);
export const viewCaveDetails = createAction<IViewCaveDetailsPayload>(
  VIEW_CAVE_DETAILS,
);
