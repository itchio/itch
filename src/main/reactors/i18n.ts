import { Watcher } from "common/util/watcher";

import { Store } from "common/types";
import { actions } from "common/actions";

import { mainLogger } from "main/logger";

const fallbackLang = "en";
const logger = mainLogger.child(__filename);

function applyLanguage(store: Store) {
  const rs = store.getState();
  const preferenceLang = rs.preferences.lang;
  const sniffedLang = rs.system.sniffedLanguage;
  const lang = preferenceLang || sniffedLang || fallbackLang;
  if (lang === rs.i18n.lang) {
    return;
  }
  logger.info(
    `Language settings: preference ${preferenceLang}, sniffed ${sniffedLang}, fallback ${fallbackLang}`
  );
  store.dispatch(actions.languageChanged({ lang }));
}

export default function (watcher: Watcher) {
  // preboot dispatches this with the full preferences, so the locale is
  // loaded well before the first window paints
  watcher.on(actions.updatePreferences, async (store, action) => {
    if (action.payload.lang !== undefined) {
      applyLanguage(store);
    }
  });

  // backstop: if preferences fail to load, still resolve a language
  watcher.on(actions.prebootDone, async (store, action) => {
    applyLanguage(store);
  });
}
