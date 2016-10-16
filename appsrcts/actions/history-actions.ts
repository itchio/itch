
import { createAction } from 'redux-actions'
import * as uuid from 'node-uuid'

import {
  DISMISS_HISTORY_ITEM,
  QUEUE_HISTORY_ITEM,
  HISTORY_READ
} from '../constants/action-types'

export const dismissHistoryItem = createAction(DISMISS_HISTORY_ITEM)

const _queueHistoryItem = createAction(QUEUE_HISTORY_ITEM)
export const queueHistoryItem = (payload) => _queueHistoryItem(Object.assign({
  id: uuid.v4(),
  date: Date.now(),
  active: true
}, payload))

export const historyRead = createAction(HISTORY_READ)
