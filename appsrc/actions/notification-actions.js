
import {createAction} from 'redux-actions'

import {
  BOUNCE,
  NOTIFY,
  NOTIFY_HTML5
} from '../constants/action-types'

export const bounce = createAction(BOUNCE)
export const notify = createAction(NOTIFY)
export const notifyHtml5 = createAction(NOTIFY_HTML5)
