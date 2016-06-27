
import {createAction} from 'redux-actions'

import {
  TASK_STARTED,
  TASK_PROGRESS,
  TASK_ENDED
} from '../constants/action-types'

export const taskStarted = createAction(TASK_STARTED)
export const taskProgress = createAction(TASK_PROGRESS)
export const taskEnded = createAction(TASK_ENDED)
