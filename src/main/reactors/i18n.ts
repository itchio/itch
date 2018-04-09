import { Watcher } from "common/util/watcher";
import { createSelector } from "reselect";

import { IRootState } from "common/types";
import { actions } from "common/actions/index";

const fallbackLang = "en";

export default function(watcher: Watcher) {
  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: IRootState) => rs.system.sniffedLanguage,
        (rs: IRootState) => rs.preferences.lang,
        (sniffedLang, preferenceLang) => {
          const lang = preferenceLang || sniffedLang || fallbackLang;
          schedule.dispatch(actions.languageChanged({ lang }));
        }
      ),
  });
}
