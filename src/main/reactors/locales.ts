import { getErrorCode, getErrorStack } from "common/butlerd/errors";
import { actions } from "common/actions";
import { I18nResources, Store } from "common/types";
import { getLocalePath, getLocalesConfigPath } from "main/util/resources";
import { Watcher } from "common/util/watcher";
import { mainLogger } from "main/logger";
import { exists, readFile } from "main/os/ifs";

const localesConfigPath = getLocalesConfigPath();

const logger = mainLogger.child(__filename);

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

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    const configPayload = await readFile(localesConfigPath);
    const config = JSON.parse(configPayload);
    store.dispatch(actions.localesConfigLoaded(config));
    // en strings ship in the bundle (common/reducers/i18n.ts initial state)
  });

  watcher.on(actions.languageChanged, async (store, action) => {
    const { lang } = action.payload;

    await loadLocale(store, lang);
  });

  watcher.on(actions.reloadLocales, async (store, action) => {
    const { lang } = store.getState().i18n;
    logger.info(`Reloading locales...`);

    await loadLocale(store, lang);
  });
}
