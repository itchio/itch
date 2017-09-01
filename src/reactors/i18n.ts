import { Watcher } from "./watcher";
import { createSelector } from "reselect";

import { languageChanged } from "../actions";
import { IRootState } from "../types";

const fallbackLang = "en";

export default function(watcher: Watcher) {
  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: IRootState) => rs.system.sniffedLanguage,
        (rs: IRootState) => rs.preferences.lang,
        (sniffedLang, preferenceLang) => {
          const lang = preferenceLang || sniffedLang || fallbackLang;
          schedule.dispatch(languageChanged({ lang }));
        }
      ),
  });
}
