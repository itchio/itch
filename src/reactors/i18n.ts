import { Watcher } from "./watcher";
import { createSelector } from "reselect";

import { languageChanged } from "../actions";
import { IAppState } from "../types";

const fallbackLang = "en";

export default function(watcher: Watcher) {
  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: IAppState) => rs.system.sniffedLanguage,
        (rs: IAppState) => rs.preferences.lang,
        (sniffedLang, preferenceLang) => {
          const lang = preferenceLang || sniffedLang || fallbackLang;
          schedule(() => store.dispatch(languageChanged({ lang })));
        }
      ),
  });
}
