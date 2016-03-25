
import {createAction} from 'redux-actions'

import {
  DISMISS_HISTORY_ITEM,
  QUEUE_HISTORY_ITEM
} from '../constants/action-types'

export const dismissHistoryItem = createAction(DISMISS_HISTORY_ITEM)
export const queueHistoryItem = createAction(QUEUE_HISTORY_ITEM)
