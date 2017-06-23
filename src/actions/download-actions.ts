import { createAction } from "redux-actions";
import * as uuid from "uuid";

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
  CANCEL_DOWNLOAD,
  ICancelDownloadPayload,
  PAUSE_DOWNLOADS,
  IPauseDownloadsPayload,
  RESUME_DOWNLOADS,
  IResumeDownloadsPayload,
  RETRY_DOWNLOAD,
  IRetryDownloadPayload,
  DOWNLOAD_SPEED_DATAPOINT,
  IDownloadSpeedDatapointPayload,
} from "../constants/action-types";

export const queueDownload = createAction<IQueueDownloadPayload>(
  QUEUE_DOWNLOAD,
);

const internalDownloadStarted = createAction<IDownloadStartedPayload>(
  DOWNLOAD_STARTED,
);

export const downloadStarted = (payload: IDownloadStartedPayload) =>
  internalDownloadStarted({ ...payload, startedAt: Date.now(), id: uuid.v4() });

export const downloadProgress = createAction<IDownloadProgressPayload>(
  DOWNLOAD_PROGRESS,
);

const internalDownloadEnded = createAction<IDownloadEndedPayload>(
  DOWNLOAD_ENDED,
);

export const downloadEnded = (payload: IDownloadEndedPayload) =>
  internalDownloadEnded({ ...payload, finishedAt: Date.now() });

export const clearFinishedDownloads = createAction<
  IClearFinishedDownloadsPayload
>(CLEAR_FINISHED_DOWNLOADS);
export const clearGameDownloads = createAction<IClearGameDownloadsPayload>(
  CLEAR_GAME_DOWNLOADS,
);

export const prioritizeDownload = createAction<IPrioritizeDownloadPayload>(
  PRIORITIZE_DOWNLOAD,
);
export const cancelDownload = createAction<ICancelDownloadPayload>(
  CANCEL_DOWNLOAD,
);
export const pauseDownloads = createAction<IPauseDownloadsPayload>(
  PAUSE_DOWNLOADS,
);
export const resumeDownloads = createAction<IResumeDownloadsPayload>(
  RESUME_DOWNLOADS,
);
export const retryDownload = createAction<IRetryDownloadPayload>(
  RETRY_DOWNLOAD,
);

export const downloadSpeedDatapoint = createAction<
  IDownloadSpeedDatapointPayload
>(DOWNLOAD_SPEED_DATAPOINT);
