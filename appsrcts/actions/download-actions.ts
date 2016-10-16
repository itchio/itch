
import { createAction } from 'redux-actions'

import {
  QUEUE_DOWNLOAD,
  DOWNLOAD_STARTED,
  DOWNLOAD_PROGRESS,
  DOWNLOAD_ENDED,

  CLEAR_FINISHED_DOWNLOADS,
  CLEAR_GAME_DOWNLOADS,

  PRIORITIZE_DOWNLOAD,
  CANCEL_DOWNLOAD,
  PAUSE_DOWNLOADS,
  RESUME_DOWNLOADS,
  RETRY_DOWNLOAD,

  DOWNLOAD_SPEED_DATAPOINT
} from '../constants/action-types'

export const queueDownload = createAction(QUEUE_DOWNLOAD)

const _downloadStarted = createAction(DOWNLOAD_STARTED)
export const downloadStarted = (payload) => _downloadStarted(Object.assign({}, payload, { date: Date.now() }))

export const downloadProgress = createAction(DOWNLOAD_PROGRESS)
export const downloadEnded = createAction(DOWNLOAD_ENDED)

export const clearFinishedDownloads = createAction(CLEAR_FINISHED_DOWNLOADS)
export const clearGameDownloads = createAction(CLEAR_GAME_DOWNLOADS)

export const prioritizeDownload = createAction(PRIORITIZE_DOWNLOAD)
export const cancelDownload = createAction(CANCEL_DOWNLOAD)
export const pauseDownloads = createAction(PAUSE_DOWNLOADS)
export const resumeDownloads = createAction(RESUME_DOWNLOADS)
export const retryDownload = createAction(RETRY_DOWNLOAD)

export const downloadSpeedDatapoint = createAction(DOWNLOAD_SPEED_DATAPOINT)
