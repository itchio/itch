
import {createAction} from 'redux-actions'

import {
  LOCALES_CONFIG_LOADED,
  QUEUE_LOCALE_DOWNLOAD,
  LOCALE_DOWNLOAD_STARTED,
  LOCALE_DOWNLOAD_ENDED
} from '../constants/action-types'

export const localesConfigLoaded = createAction(LOCALES_CONFIG_LOADED)
export const queueLocaleDownload = createAction(QUEUE_LOCALE_DOWNLOAD)
export const localeDownloadStarted = createAction(LOCALE_DOWNLOAD_STARTED)
export const localeDownloadEnded = createAction(LOCALE_DOWNLOAD_ENDED)
