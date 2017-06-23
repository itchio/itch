import { createAction } from "redux-actions";

import {
  LOCALES_CONFIG_LOADED,
  ILocalesConfigLoadedPayload,
  QUEUE_LOCALE_DOWNLOAD,
  IQueueLocaleDownloadPayload,
  LOCALE_DOWNLOAD_STARTED,
  ILocaleDownloadStartedPayload,
  LOCALE_DOWNLOAD_ENDED,
  ILocaleDownloadEndedPayload,
} from "../constants/action-types";

export const localesConfigLoaded = createAction<ILocalesConfigLoadedPayload>(
  LOCALES_CONFIG_LOADED,
);
export const queueLocaleDownload = createAction<IQueueLocaleDownloadPayload>(
  QUEUE_LOCALE_DOWNLOAD,
);
export const localeDownloadStarted = createAction<
  ILocaleDownloadStartedPayload
>(LOCALE_DOWNLOAD_STARTED);
export const localeDownloadEnded = createAction<ILocaleDownloadEndedPayload>(
  LOCALE_DOWNLOAD_ENDED,
);
