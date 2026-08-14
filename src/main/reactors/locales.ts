import { getErrorCode, getErrorStack } from "common/butlerd/errors";
import { actions } from "common/actions";
import { I18nResources, Store } from "common/types";
import { getLocalePath, getLocalesConfigPath } from "main/util/resources";
import { Watcher } from "common/util/watcher";
import { app } from "electron";
import env from "main/env";
import fs from "fs";
import { dirname } from "path";
import { mainLogger } from "main/logger";
import { exists, readFile } from "main/os/ifs";
import { debounce } from "underscore";

const localesConfigPath = getLocalesConfigPath();

const logger = mainLogger.child(__filename);
let devLocaleWatcherStarted = false;

function canonicalFileName(lang: string): string {
  return getLocalePath(`${lang}.json`);
}

async function loadLocale(store: Store, lang: string) {
  let local = canonicalFileName(lang);
  if (!(await exists(local))) {
    // try stripping region
    lang = lang.substring(0, 2);
    local = canonicalFileName(lang);
  }

  try {
    logger.debug(`Reading locale file ${local}`);
    const payload = await readFile(local);
    commitLocale(store, lang, JSON.parse(payload));
  } catch (e) {
    if (getErrorCode(e) === "ENOENT") {
      logger.warn(`No such locale ${local}`);
    } else {
      logger.warn(`Failed to load locale from ${local}: ${getErrorStack(e)}`);
    }
  }
}

function commitLocale(store: Store, lang: string, resources: I18nResources) {
  store.dispatch(actions.localeLoaded({ lang, resources }));
}

function mountDevLocaleWatcher(store: Store) {
  if (!env.development || devLocaleWatcherStarted) {
    return;
  }
  devLocaleWatcherStarted = true;

  const localesDir = dirname(canonicalFileName("en"));
  const changedLangs = new Set<string>();

  const flush = debounce(() => {
    const current = store.getState().i18n.lang;
    for (const lang of changedLangs) {
      // en also stays fresh because it's the t() fallback
      if (
        lang === "en" ||
        lang === current ||
        lang === current.substring(0, 2)
      ) {
        logger.info(`Locale file changed, reloading ${lang}`);
        void loadLocale(store, lang);
      }
    }
    changedLangs.clear();
  }, 100);

  try {
    const fileWatcher = fs.watch(localesDir, (_eventType, filename) => {
      const name = String(filename || "");
      if (name.endsWith(".json")) {
        changedLangs.add(name.slice(0, -".json".length));
        flush();
      }
    });

    fileWatcher.on("error", (e) => {
      logger.warn(`Dev locale watcher errored: ${getErrorStack(e) || e}`);
    });

    app.on("before-quit", () => {
      flush.cancel();
      changedLangs.clear();
      fileWatcher.close();
    });

    logger.info(`Watching ${localesDir} for locale changes`);
  } catch (e) {
    logger.warn(`Could not start dev locale watcher: ${getErrorStack(e) || e}`);
  }
}

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    const configPayload = await readFile(localesConfigPath);
    const config = JSON.parse(configPayload);
    store.dispatch(actions.localesConfigLoaded(config));
    mountDevLocaleWatcher(store);
  });

  watcher.on(actions.languageChanged, async (store, action) => {
    const { lang } = action.payload;

    // en is the t() fallback for keys missing from partial translations
    if (!lang.startsWith("en") && !store.getState().i18n.strings.en) {
      await loadLocale(store, "en");
    }
    await loadLocale(store, lang);
  });

  watcher.on(actions.reloadLocales, async (store, action) => {
    const { lang } = store.getState().i18n;
    logger.info(`Reloading locales...`);

    await loadLocale(store, lang);
  });
}
