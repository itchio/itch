
import {createAction} from 'redux-actions'

import {
  QUEUE_GAME,
  BROWSE_GAME,

  REPORT_CAVE,
  CANCEL_CAVE,
  INITIATE_PURCHASE
} from '../constants/action-types'

export const queueGame = createAction(QUEUE_GAME)
export const browseGame = createAction(BROWSE_GAME)

export const reportCave = createAction(REPORT_CAVE)
export const cancelCave = createAction(CANCEL_CAVE)
export const initiatePurchase = createAction(INITIATE_PURCHASE)
