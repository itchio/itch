
import {createAction} from 'redux-actions'

import {
  TASK_STARTED,
  TASK_PROGRESS,
  TASK_ENDED,

  ABORT_TASK
} from '../constants/action-types'

export const taskStarted = createAction(TASK_STARTED)
export const taskProgress = createAction(TASK_PROGRESS)
export const taskEnded = createAction(TASK_ENDED)

export const abortTask = createAction(ABORT_TASK)
