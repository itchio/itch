import { createAction } from "redux-actions";

import {
  QUEUE_GAME,
  IQueueGamePayload,
  QUEUE_LAUNCH,
  IQueueLaunchPayload,
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
  FORCE_CLOSE_GAME_REQUEST,
  IForceCloseGameRequestPayload,
  FORCE_CLOSE_LAST_GAME,
  IForceCloseLastGamePayload,
  FORCE_CLOSE_GAME,
  IForceCloseGamePayload,
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
  IManageGamePayload,
  MANAGE_GAME,
  IQueueGameInstallPayload,
  QUEUE_GAME_INSTALL,
} from "../constants/action-types";

export const queueGame = createAction<IQueueGamePayload>(QUEUE_GAME);
export const queueGameInstall = createAction<IQueueGameInstallPayload>(
  QUEUE_GAME_INSTALL
);
export const queueLaunch = createAction<IQueueLaunchPayload>(QUEUE_LAUNCH);

export const probeCave = createAction<IProbeCavePayload>(PROBE_CAVE);
export const exploreCave = createAction<IExploreCavePayload>(EXPLORE_CAVE);
export const reportCave = createAction<IReportCavePayload>(REPORT_CAVE);
export const manageGame = createAction<IManageGamePayload>(MANAGE_GAME);
export const requestCaveUninstall = createAction<IRequestCaveUninstallPayload>(
  REQUEST_CAVE_UNINSTALL
);
export const queueCaveUninstall = createAction<IQueueCaveUninstallPayload>(
  QUEUE_CAVE_UNINSTALL
);
export const queueCaveReinstall = createAction<IQueueCaveReinstallPayload>(
  QUEUE_CAVE_REINSTALL
);
export const initiatePurchase = createAction<IInitiatePurchasePayload>(
  INITIATE_PURCHASE
);
export const encourageGenerosity = createAction<IEncourageGenerosityPayload>(
  ENCOURAGE_GENEROSITY
);
export const purchaseCompleted = createAction<IPurchaseCompletedPayload>(
  PURCHASE_COMPLETED
);

export const forceCloseGameRequest = createAction<
  IForceCloseGameRequestPayload
>(FORCE_CLOSE_GAME_REQUEST);
export const forceCloseLastGame = createAction<IForceCloseLastGamePayload>(
  FORCE_CLOSE_LAST_GAME
);
export const forceCloseGame = createAction<IForceCloseGamePayload>(
  FORCE_CLOSE_GAME
);

export const checkForGameUpdate = createAction<ICheckForGameUpdatePayload>(
  CHECK_FOR_GAME_UPDATE
);
export const checkForGameUpdates = createAction<ICheckForGameUpdatesPayload>(
  CHECK_FOR_GAME_UPDATES
);
export const gameUpdateAvailable = createAction<IGameUpdateAvailablePayload>(
  GAME_UPDATE_AVAILABLE
);
export const showGameUpdate = createAction<IShowGameUpdatePayload>(
  SHOW_GAME_UPDATE
);
export const queueGameUpdate = createAction<IQueueGameUpdatePayload>(
  QUEUE_GAME_UPDATE
);

export const nukeCavePrereqs = createAction<INukeCavePrereqsPayload>(
  NUKE_CAVE_PREREQS
);
export const configureCave = createAction<IConfigureCavePayload>(
  CONFIGURE_CAVE
);
export const revertCaveRequest = createAction<IRevertCaveRequestPayload>(
  REVERT_CAVE_REQUEST
);
export const healCave = createAction<IHealCavePayload>(HEAL_CAVE);
export const viewCaveDetails = createAction<IViewCaveDetailsPayload>(
  VIEW_CAVE_DETAILS
);
