import { createAction } from "redux-actions";
import uuid from "../util/uuid";

import {
  QUEUE_DOWNLOAD,
  IQueueDownloadPayload,
  DOWNLOAD_STARTED,
  IDownloadStartedPayload,
  DOWNLOAD_PROGRESS,
  IDownloadProgressPayload,
  DOWNLOAD_ENDED,
  IDownloadEndedPayload,
  CLEAR_FINISHED_DOWNLOADS,
  IClearFinishedDownloadsPayload,
  CLEAR_GAME_DOWNLOADS,
  IClearGameDownloadsPayload,
  PRIORITIZE_DOWNLOAD,
  IPrioritizeDownloadPayload,
  DISCARD_DOWNLOAD,
  IDiscardDownloadPayload,
  DISCARD_DOWNLOAD_REQUEST,
  IDiscardDownloadRequestPayload,
  PAUSE_DOWNLOADS,
  IPauseDownloadsPayload,
  RESUME_DOWNLOADS,
  IResumeDownloadsPayload,
  RETRY_DOWNLOAD,
  IRetryDownloadPayload,
  DOWNLOAD_SPEED_DATAPOINT,
  IDownloadSpeedDatapointPayload,
  IDownloadDiscardedPayload,
  DOWNLOAD_DISCARDED,
  IShowDownloadErrorPayload,
  SHOW_DOWNLOAD_ERROR,
} from "../constants/action-types";

export const queueDownload = createAction<IQueueDownloadPayload>(
  QUEUE_DOWNLOAD
);

const internalDownloadStarted = createAction<IDownloadStartedPayload>(
  DOWNLOAD_STARTED
);

export const downloadStarted = (payload: IDownloadStartedPayload) =>
  internalDownloadStarted({ ...payload, startedAt: Date.now(), id: uuid() });

export const downloadProgress = createAction<IDownloadProgressPayload>(
  DOWNLOAD_PROGRESS
);

const internalDownloadEnded = createAction<IDownloadEndedPayload>(
  DOWNLOAD_ENDED
);

export const downloadEnded = (payload: IDownloadEndedPayload) =>
  internalDownloadEnded({ ...payload, finishedAt: Date.now() });

export const clearFinishedDownloads = createAction<
  IClearFinishedDownloadsPayload
>(CLEAR_FINISHED_DOWNLOADS);
export const clearGameDownloads = createAction<IClearGameDownloadsPayload>(
  CLEAR_GAME_DOWNLOADS
);

export const prioritizeDownload = createAction<IPrioritizeDownloadPayload>(
  PRIORITIZE_DOWNLOAD
);
export const showDownloadError = createAction<IShowDownloadErrorPayload>(
  SHOW_DOWNLOAD_ERROR
);
export const discardDownloadRequest = createAction<
  IDiscardDownloadRequestPayload
>(DISCARD_DOWNLOAD_REQUEST);
export const discardDownload = createAction<IDiscardDownloadPayload>(
  DISCARD_DOWNLOAD
);
export const downloadDiscarded = createAction<IDownloadDiscardedPayload>(
  DOWNLOAD_DISCARDED
);
export const pauseDownloads = createAction<IPauseDownloadsPayload>(
  PAUSE_DOWNLOADS
);
export const resumeDownloads = createAction<IResumeDownloadsPayload>(
  RESUME_DOWNLOADS
);
export const retryDownload = createAction<IRetryDownloadPayload>(
  RETRY_DOWNLOAD
);

export const downloadSpeedDatapoint = createAction<
  IDownloadSpeedDatapointPayload
>(DOWNLOAD_SPEED_DATAPOINT);
