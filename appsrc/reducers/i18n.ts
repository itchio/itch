
import {omit} from "underscore";
import * as actions from "../actions";
import reducer from "./reducer";

import {II18nState} from "../types";

const initialState = {
  lang: "en",
  strings: {
    en: {},
  },
  downloading: {},
  queued: {},
  locales: [],
} as II18nState;

export default reducer<II18nState>(initialState, (on) => {
  on(actions.localesConfigLoaded, (state, action) => {
    return {
      ...state,
      ...action.payload,
    };
  });

  on(actions.queueLocaleDownload, (state, action) => {
    return {
      ...state,
      queued: { ...state.queued, [action.payload.lang]: true },
    };
  });

  on(actions.localeDownloadStarted, (state, action) => {
    return {
      ...state,
      queued: omit(state.downloading, action.payload.lang),
      downloading: { ...state.downloading, [action.payload.lang]: true },
    };
  });

  on(actions.localeDownloadEnded, (state, action) => {
    return {
      ...state,
      downloading: omit(state.downloading, action.payload.lang),
    };
  });

  on(actions.languageChanged, (state, action) => {
    return {
      ...state,
      lang: action.payload.lang,
    };
  });
});
