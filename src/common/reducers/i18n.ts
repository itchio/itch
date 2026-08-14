import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

import { I18nState } from "common/types";
import env from "common/env";

const initialState = {
  lang: "en",
  strings: {},
  locales: [],
} as I18nState;

export default reducer<I18nState>(initialState, (on) => {
  on(actions.localesConfigLoaded, (state, action) => {
    const config = action.payload;
    return { ...state, ...config };
  });

  on(actions.localeLoaded, (state, action) => {
    const { lang, resources } = action.payload;
    return {
      ...state,
      strings: {
        ...state.strings,
        [lang]: resources,
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
