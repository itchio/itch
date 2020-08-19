import { Watcher } from "common/util/watcher";
import { createSelector } from "reselect";

import { RootState } from "common/types";
import { actions } from "common/actions";

import { mainLogger } from "main/logger";

const fallbackLang = "en";
const logger = mainLogger.child(__filename);

export default function (watcher: Watcher) {
  watcher.onStateChange({
    makeSelector: (store, schedule) =>
      createSelector(
        (rs: RootState) => rs.system.sniffedLanguage,
        (rs: RootState) => rs.preferences.lang,
        (sniffedLang, preferenceLang) => {
          const lang = preferenceLang || sniffedLang || fallbackLang;
          logger.info(
            `Language settings: preference ${preferenceLang}, sniffed ${sniffedLang}, fallback ${fallbackLang}`
          );
          schedule.dispatch(actions.languageChanged({ lang }));
        }
      ),
  });
}
