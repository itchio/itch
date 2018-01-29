import { omit } from "underscore";
import { actions } from "../actions";
import reducer from "./reducer";

import { II18nState } from "../types";

const initialState = {
  lang: "en",
  strings: {
    en: {},
  },
  downloading: {},
  queued: {},
  locales: [],
} as II18nState;

export default reducer<II18nState>(initialState, on => {
  on(actions.localesConfigLoaded, (state, action) => {
    const config = action.payload;
    return { ...state, ...config };
  });

  on(actions.queueLocaleDownload, (state, action) => {
    const { lang } = action.payload;
    return {
      ...state,
      queued: { ...state.queued, [lang]: true },
    };
  });

  on(actions.localeDownloadStarted, (state, action) => {
    const { lang } = action.payload;
    return {
      ...state,
      queued: omit(state.downloading, lang),
      downloading: { ...state.downloading, [lang]: true },
    };
  });

  on(actions.localeDownloadEnded, (state, action) => {
    const { lang, resources } = action.payload;
    return {
      ...state,
      downloading: omit(state.downloading, lang),
      strings: {
        ...state.strings,
        [lang]: {
          ...state.strings[lang],
          ...resources,
        },
      },
    };
  });

  on(actions.languageChanged, (state, action) => {
    const { lang } = action.payload;
    return {
      ...state,
      lang,
    };
  });
});
