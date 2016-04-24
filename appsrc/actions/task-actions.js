
import {createAction} from 'redux-actions'

import {
  TASK_STARTED,
  TASK_PROGRESS,
  TASK_ENDED,

  DOWNLOAD_STARTED,
  DOWNLOAD_PROGRESS,
  DOWNLOAD_ENDED,

  CLEAR_FINISHED_DOWNLOADS,

  PRIORITIZE_DOWNLOAD,
  PAUSE_DOWNLOADS,
  RESUME_DOWNLOADS,
  RETRY_DOWNLOAD
} from '../constants/action-types'

export const taskStarted = createAction(TASK_STARTED)
export const taskProgress = createAction(TASK_PROGRESS)
export const taskEnded = createAction(TASK_ENDED)

const _downloadStarted = createAction(DOWNLOAD_STARTED)
export const downloadStarted = (payload) => _downloadStarted({...payload, date: Date.now()})

export const downloadProgress = createAction(DOWNLOAD_PROGRESS)
export const downloadEnded = createAction(DOWNLOAD_ENDED)

export const clearFinishedDownloads = createAction(CLEAR_FINISHED_DOWNLOADS)

export const prioritizeDownload = createAction(PRIORITIZE_DOWNLOAD)
export const pauseDownloads = createAction(PAUSE_DOWNLOADS)
export const resumeDownloads = createAction(RESUME_DOWNLOADS)
export const retryDownload = createAction(RETRY_DOWNLOAD)
