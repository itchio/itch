import { actions } from "common/actions";
import urls from "common/constants/urls";
import env from "common/env";
import { I18nResources, I18nResourceSet, Store } from "common/types";
import { getLocalePath, getLocalesConfigPath } from "common/util/resources";
import { Watcher } from "common/util/watcher";
import { app } from "electron";
import { mainLogger } from "main/logger";
import { join } from "path";
import { request } from "main/net/request";
import { exists, readFile, writeFile } from "main/os/ifs";

const upgradesEnabled =
  (env.production && !env.integrationTests) ||
  process.env.DID_I_STUTTER === "1";

const remoteDir = join(app.getPath("userData"), "locales");
const localesConfigPath = getLocalesConfigPath();

const logger = mainLogger.child(__filename);

function canonicalFileName(lang: string): string {
  return getLocalePath(`${lang}.json`);
}

function remoteFileName(lang: string): string {
  return join(remoteDir, `${lang}.json`);
}

function processLocaleResources(resources: I18nResources): I18nResources {
  // react-intl now uses ASCII single quotes ("'") to escape characters,
  // however, we have strings like `Try searching for '{{example}}'`, and we
  // want them to appear as actual quotes, and we want "{{example}}" to be
  // interpolated, we don't want it to appear verbatim.
  for (const k of Object.keys(resources)) {
    resources[k] = resources[k].replace("'{{", "''{{");
  }
  return resources;
}

async function doDownloadLocale(
  lang: string,
  resources: I18nResources,
  { implicit }: { implicit: boolean }
): Promise<I18nResources> {
  if (!upgradesEnabled) {
    if (!implicit) {
      logger.debug(
        `Not downloading locale (${lang}) in development, export DID_I_STUTTER=1 to override`
      );
    }
    return {};
  }

  const local = canonicalFileName(lang);
  if (!local) {
    // try stripping region
    lang = lang.substring(0, 2);
  }

  const remote = remoteFileName(lang);
  const uri = `${urls.remoteLocalePath}/${lang}.json`;

  logger.debug(`Downloading fresh locale file from ${uri}`);
  const resp = await request("get", uri, {}, { format: "json" });

  logger.debug(`HTTP GET ${uri}: ${resp.statusCode}`);
  if (resp.statusCode === 404) {
    // no such locale, alrighty then.
    return {};
  } else if (resp.statusCode !== 200) {
    throw new Error("Locale update server is down, try again later");
  }

  const payload = JSON.parse(resp.body);

  const finalResources = {
    ...resources,
    ...payload,
  };

  try {
    logger.debug(`Saving fresh ${lang} locale to ${remote}`);
    const payload = JSON.stringify(finalResources, null, 2);
    await writeFile(remote, payload, { encoding: "utf8" });
  } catch (e) {
    logger.warn(
      `Could not save locale to ${remote}: ${e.stack || e.message || e}`
    );
  }

  return processLocaleResources(finalResources);
}

async function loadLocale(store: Store, lang: string) {
  let local = canonicalFileName(lang);
  if (!(await exists(local))) {
    // try stripping region
    lang = lang.substring(0, 2);
    local = canonicalFileName(lang);
  }

  try {
    logger.debug(`Reading local locale file ${local}`);
    const payload = await readFile(local);
    const resources = processLocaleResources(JSON.parse(payload));
    commitLocale(store, lang, resources);
  } catch (e) {
    if (e.code === "ENOENT") {
      logger.warn(`No such locale ${local}`);
    } else {
      logger.warn(`Failed to load locale from ${local}: ${e.stack}`);
    }
  }

  if (upgradesEnabled) {
    const remote = remoteFileName(lang);
    try {
      let payload: string;
      try {
        logger.debug(`Reading remote locale file ${local}`);
        payload = await readFile(remote);
      } catch (e) {
        // no updated version of the locale available
      }

      if (payload) {
        const resources = processLocaleResources(JSON.parse(payload));
        commitLocale(store, lang, resources);
      }
    } catch (e) {
      logger.warn(`Failed to load locale from ${local}: ${e.stack}`);
    }
  }

  store.dispatch(actions.queueLocaleDownload({ lang, implicit: true }));
}

function commitLocale(store: Store, lang: string, resourcesIn: I18nResources) {
  const resources: I18nResources = {};
  for (const key of Object.keys(resourcesIn)) {
    const value = resourcesIn[key];
    resources[key] = value.replace(/{{/g, "{").replace(/}}/g, "}");
  }
  store.dispatch(actions.localeDownloadEnded({ lang, resources }));
}

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    // load initial locales
    const configPayload = await readFile(localesConfigPath);
    const config = JSON.parse(configPayload);
    store.dispatch(actions.localesConfigLoaded(config));

    await loadLocale(store, "en");
  });

  watcher.onDebounced(
    actions.queueLocaleDownload,
    2000,
    async (store, action) => {
      let { lang, implicit } = action.payload;

      const downloading = store.getState().i18n.downloading;
      if (downloading[lang]) {
        return;
      }

      store.dispatch(actions.localeDownloadStarted({ lang }));

      let resources = {};
      try {
        resources = await doDownloadLocale(lang, resources, { implicit });
      } catch (e) {
        logger.warn(`Failed downloading locale for ${lang}: ${e.message}`);
      } finally {
        commitLocale(store, lang, resources);
      }
    }
  );

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
