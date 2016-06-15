
import {createAction} from 'redux-actions'

import {
  QUEUE_GAME,
  BROWSE_GAME,

  PROBE_CAVE,
  EXPLORE_CAVE,
  REPORT_CAVE,
  CANCEL_CAVE,
  IMPLODE_CAVE,
  REQUEST_CAVE_UNINSTALL,
  QUEUE_CAVE_UNINSTALL,
  QUEUE_CAVE_REINSTALL,
  INITIATE_PURCHASE,
  PURCHASE_COMPLETED,
  ENCOURAGE_GENEROSITY,
  INITIATE_SHARE,

  CHECK_FOR_GAME_UPDATE,
  CHECK_FOR_GAME_UPDATES
} from '../constants/action-types'

export const queueGame = createAction(QUEUE_GAME)
export const browseGame = createAction(BROWSE_GAME)

export const probeCave = createAction(PROBE_CAVE)
export const exploreCave = createAction(EXPLORE_CAVE)
export const reportCave = createAction(REPORT_CAVE)
export const cancelCave = createAction(CANCEL_CAVE)
export const implodeCave = createAction(IMPLODE_CAVE)
export const requestCaveUninstall = createAction(REQUEST_CAVE_UNINSTALL)
export const queueCaveUninstall = createAction(QUEUE_CAVE_UNINSTALL)
export const queueCaveReinstall = createAction(QUEUE_CAVE_REINSTALL)
export const initiatePurchase = createAction(INITIATE_PURCHASE)
export const encourageGenerosity = createAction(ENCOURAGE_GENEROSITY)
export const initiateShare = createAction(INITIATE_SHARE)
export const purchaseCompleted = createAction(PURCHASE_COMPLETED)

export const checkForGameUpdate = createAction(CHECK_FOR_GAME_UPDATE)
export const checkForGameUpdates = createAction(CHECK_FOR_GAME_UPDATES)
