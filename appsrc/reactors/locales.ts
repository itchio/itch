
import {Watcher} from "./watcher";

import * as ospath from "path";
import ifs from "../localizer/ifs";

import net from "../util/net";
import urls from "../constants/urls";
import {app} from "electron";
import * as env from "../env";

import delay from "../reactors/delay";

const upgradesEnabled = (env.name === "production") || (process.env.DID_I_STUTTER === "1");

const remoteDir = ospath.join(app.getPath("userData"), "locales");
const localesDir = ospath.resolve(ospath.join(__dirname, "static", "locales"));
const localesConfigPath = ospath.resolve(ospath.join(localesDir, "..", "locales.json"));

import {IStore, II18nResources} from "../types";

import logger from "../logger";
import mklog from "../util/log";
const log = mklog("locales");
const opts = {logger};

import * as actions from "../actions";

function canonicalFileName (lang: string): string {
  return ospath.join(localesDir, lang + ".json");
}

function remoteFileName (lang: string): string {
  return ospath.join(remoteDir, lang + ".json");
}

async function doDownloadLocale (lang: string, resources: II18nResources): Promise<II18nResources> {
  const local = canonicalFileName(lang);
  if (!(await ifs.exists(local))) {
    // try stripping region
    lang = lang.substring(0, 2);
  }

  const remote = remoteFileName(lang);
  const uri = `${urls.remoteLocalePath}/${lang}.json`;

  log(opts, `Downloading fresh locale file from ${uri}`);
  const resp = await net.request("get", uri, {}, {format: "json"});

  log(opts, `HTTP GET ${uri}: ${resp.statusCode}`);
  if (resp.statusCode !== 200) {
    throw new Error("Locale update server is down, try again later");
  }

  const finalResources = {
    ...resources,
    ...resp.body,
  };

  try {
    log(opts, `Saving fresh ${lang} locale to ${remote}`);
    const payload = JSON.stringify(finalResources, null, 2);
    await ifs.writeFile(remote, payload, {encoding: "utf8"});
  } catch (e) {
    log(opts, `Could not save locale to ${remote}: ${e.stack || e.message || e}`);
  }

  return finalResources;
}

async function loadLocale (store: IStore, lang: string) {
  let local = canonicalFileName(lang);
  if (!(await ifs.exists(local))) {
    // try stripping region
    lang = lang.substring(0, 2);
    local = canonicalFileName(lang);
  }

  try {
    const payload = await ifs.readFile(local);
    const resources = JSON.parse(payload);
    store.dispatch(actions.localeDownloadEnded({lang, resources}));
  } catch (e) {
    log(opts, `Failed to load locale from ${local}: ${e.stack}`);
  }

  const remote = remoteFileName(lang);
  try {
    let payload: string;
    try {
      payload = await ifs.readFile(remote);
    } catch (e) {
      // no updated version of the locale available
    }

    if (payload) {
      const resources = JSON.parse(payload);
      store.dispatch(actions.localeDownloadEnded({lang, resources}));
    }
  } catch (e) {
    log(opts, `Failed to load locale from ${local}: ${e.stack}`);
  }

  store.dispatch(actions.queueLocaleDownload({lang}));
}

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    // load initial locales
    const configPayload = await ifs.readFile(localesConfigPath);
    const config = JSON.parse(configPayload);
    store.dispatch(actions.localesConfigLoaded(config));

    await loadLocale(store, "en");
  });

  watcher.on(actions.queueLocaleDownload, async (store, action) => {
    let {lang} = action.payload;

    if (!upgradesEnabled) {
      log(opts, `Not downloading locale (${lang}) in development, export DID_I_STUTTER=1 to override`);
      return;
    }

    const downloading = store.getState().i18n.downloading;
    if (downloading[lang]) {
      return;
    }

    store.dispatch(actions.localeDownloadStarted({lang}));

    log(opts, `Waiting a bit before downloading ${lang} locale...`);
    await delay(1000);

    let resources = {};
    try {
      resources = await doDownloadLocale(lang, resources);
    } catch (e) {
      log(opts, `Failed downloading locale for ${lang}: ${e.message}`);
      store.dispatch(actions.queueHistoryItem({
        label: ["i18n.failed_downloading_locales", {lang}],
        detail: e.stack || e,
      }));
    } finally {
      store.dispatch(actions.localeDownloadEnded({lang, resources}));
    }
  });

  watcher.on(actions.languageChanged, async (store, action) => {
    const {lang} = action.payload;

    await loadLocale(store, lang);
  });
}
