import { createAction } from "redux-actions";

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
  IDownloadsRestoredPayload,
  DOWNLOADS_RESTORED,
  ICleanDownloadsSearchPayload,
  CLEAN_DOWNLOADS_SEARCH,
  ICleanDownloadsFoundEntriesPayload,
  CLEAN_DOWNLOADS_FOUND_ENTRIES,
  ICleanDownloadsApplyPayload,
  CLEAN_DOWNLOADS_APPLY,
} from "../constants/action-types";

export const queueDownload = createAction<IQueueDownloadPayload>(
  QUEUE_DOWNLOAD
);

export const downloadStarted = createAction<IDownloadStartedPayload>(
  DOWNLOAD_STARTED
);

export const downloadProgress = createAction<IDownloadProgressPayload>(
  DOWNLOAD_PROGRESS
);

const internalDownloadEnded = createAction<IDownloadEndedPayload>(
  DOWNLOAD_ENDED
);

export const downloadEnded = (payload: IDownloadEndedPayload) =>
  internalDownloadEnded({ ...payload, finishedAt: new Date() });

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

export const downloadsRestored = createAction<IDownloadsRestoredPayload>(
  DOWNLOADS_RESTORED
);

export const cleanDownloadsSearch = createAction<ICleanDownloadsSearchPayload>(
  CLEAN_DOWNLOADS_SEARCH
);

export const cleanDownloadsFoundEntries = createAction<
  ICleanDownloadsFoundEntriesPayload
>(CLEAN_DOWNLOADS_FOUND_ENTRIES);

export const cleanDownloadsApply = createAction<ICleanDownloadsApplyPayload>(
  CLEAN_DOWNLOADS_APPLY
);
