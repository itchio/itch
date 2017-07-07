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
const internalLocaleDownloadEnded = createAction<ILocaleDownloadEndedPayload>(
  LOCALE_DOWNLOAD_ENDED,
);

const emptyObj = {};

export const localeDownloadEnded = (payload: ILocaleDownloadEndedPayload) => {
  const resources = {};
  for (const key of Object.keys(payload.resources || emptyObj)) {
    const value = payload.resources[key];
    resources[key] = value.replace(/{{/g, "{").replace(/}}/g, "}");
  }
  return internalLocaleDownloadEnded({
    lang: payload.lang,
    resources,
  });
};
