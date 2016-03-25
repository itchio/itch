
import {createAction} from 'redux-actions'

import {
  TASK_STARTED,
  TASK_PROGRESS,
  TASK_ENDED,

  DOWNLOAD_STARTED,
  DOWNLOAD_PROGRESS,
  DOWNLOAD_ENDED
} from '../constants/action-types'

export const taskStarted = createAction(TASK_STARTED)
export const taskProgress = createAction(TASK_PROGRESS)
export const taskEnded = createAction(TASK_ENDED)

export const downloadStarted = createAction(DOWNLOAD_STARTED)
export const downloadProgress = createAction(DOWNLOAD_PROGRESS)
export const downloadEnded = createAction(DOWNLOAD_ENDED)
