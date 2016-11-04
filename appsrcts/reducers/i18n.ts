
import {omit} from "underscore";
import {handleActions} from "redux-actions";

import {
  IAction,
  ILocalesConfigLoadedPayload,
  IQueueLocaleDownloadPayload,
  ILocaleDownloadStartedPayload,
  ILocaleDownloadEndedPayload,
  ILanguageChangedPayload,
} from "../constants/action-types";

import {II18nState} from "../types/db";

const initialState = {
  lang: "en",
  strings: {
    en: {},
  },
  downloading: {},
  queued: {},
  locales: {},
};

export default handleActions<II18nState, any>({
  LOCALES_CONFIG_LOADED: (state: II18nState, action: IAction<ILocalesConfigLoadedPayload>) => {
    const config = action.payload;
    return Object.assign({}, state, config);
  },

  QUEUE_LOCALE_DOWNLOAD: (state: II18nState, action: IAction<IQueueLocaleDownloadPayload>) => {
    const {lang} = action.payload;
    const queued = Object.assign({}, state.queued, {[lang]: true});
    return Object.assign({}, state, {queued});
  },

  LOCALE_DOWNLOAD_STARTED: (state: II18nState, action: IAction<ILocaleDownloadStartedPayload>) => {
    const {lang} = action.payload;
    const queued = omit(state.queued, lang);
    const downloading = Object.assign({}, state.downloading, {[lang]: true});
    return Object.assign({}, state, {queued, downloading});
  },

  LOCALE_DOWNLOAD_ENDED: (state: II18nState, action: IAction<ILocaleDownloadEndedPayload>) => {
    const {lang, resources} = action.payload;
    const oldResources = state.strings[lang] || {};

    const strings = Object.assign({}, state.strings, {
      [lang]: Object.assign({}, oldResources, resources),
    });
    const downloading = omit(state.downloading, lang);
    return Object.assign({}, state, {strings, downloading});
  },

  LANGUAGE_CHANGED: (state: II18nState, action: IAction<ILanguageChangedPayload>) => {
    const lang = action.payload;
    return Object.assign({}, state, {lang});
  },
}, initialState);
