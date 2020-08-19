import { omit } from "underscore";
import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { I18nState } from "common/types";
import env from "common/env";

const initialState = {
  lang: "en",
  strings: {
    en: {},
  },
  downloading: {},
  queued: {},
  locales: [],
} as I18nState;

export default reducer<I18nState>(initialState, (on) => {
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
    if (env.integrationTests) {
      // stay with 'en' in integration tests
      return state;
    }

    const { lang } = action.payload;
    return {
      ...state,
      lang,
    };
  });
});
