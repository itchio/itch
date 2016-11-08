
import * as ospath from "path";
import * as invariant from "invariant";
import ifs from "../localizer/ifs";

import * as needle from "../promised/needle";
import urls from "../constants/urls";
import {app} from "../electron";
import * as env from "../env";

import delay from "../reactors/delay";

const upgradesEnabled = (env.name === "production") || (process.env.DID_I_STUTTER === "1");

const remoteDir = ospath.join(app.getPath("userData"), "locales");
const localesDir = ospath.resolve(ospath.join(__dirname, "..", "static", "locales"));
const localesConfigPath = ospath.resolve(ospath.join(localesDir, "..", "locales.json"));

import {IStore, II18nResources} from "../types";
import {IAction, IQueueLocaleDownloadPayload, ILanguageChangedPayload} from "../constants/action-types";

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

async function doDownloadLocale (lang: string, resources: II18nResources) {
  const local = canonicalFileName(lang);
  if (!(await ifs.exists(local))) {
    // try stripping region
    lang = lang.substring(0, 2);
  }

  const remote = remoteFileName(lang);
  const uri = `${urls.remoteLocalePath}/${lang}.json`;

  log(opts, `Downloading fresh locale file from ${uri}`);
  const resp = await needle.requestAsync("get", uri, {}, {format: "json"});

  log(opts, `HTTP GET ${uri}: ${resp.statusCode}`);
  if (resp.statusCode !== 200) {
    throw new Error("Locale update server is down, try again later");
  }

  Object.assign(resources, resp.body);

  log(opts, `Saving fresh ${lang} locale to ${remote}`);
  const payload = JSON.stringify(resources, null, 2);
  await ifs.writeFile(remote, payload);
}

async function boot (store: IStore) {
  // load initial locales
  const configPayload = await ifs.readFile(localesConfigPath);
  const config = JSON.parse(configPayload);
  store.dispatch(actions.localesConfigLoaded(config));

  await loadLocale(store, "en");
}

async function queueLocaleDownload (store: IStore, action: IAction<IQueueLocaleDownloadPayload>) {
  let {lang} = action.payload;

  if (!upgradesEnabled) {
    log(opts, "Not downloading locales in development, export DID_I_STUTTER=1 to override");
    return;
  }

  const downloading = store.getState().i18n.downloading;
  if (downloading[lang]) {
    return;
  }

  store.dispatch(actions.localeDownloadStarted({lang}));

  log(opts, `Waiting a bit before downloading ${lang} locale...`);
  await delay(1000);

  const resources = {};
  try {
    await doDownloadLocale(lang, resources);
  } catch (e) {
    log(opts, `Failed downloading locale for ${lang}: ${e.message}`);
    store.dispatch(actions.queueHistoryItem({
      label: ["i18n.failed_downloading_locales", {lang}],
      detail: e.stack || e,
    }));
  } finally {
    store.dispatch(actions.localeDownloadEnded({lang, resources}));
  }
}

async function loadLocale (store: IStore, lang: string) {
  invariant(typeof store === "object", "loadLocale needs a store");
  invariant(typeof lang === "string", "loadLocale needs a lang string");

  const local = canonicalFileName(lang);
  if (!(await ifs.exists(local))) {
    // try stripping region
    lang = lang.substring(0, 2);
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

async function languageChanged (store: IStore, action: IAction<ILanguageChangedPayload>) {
  const lang = action.payload;
  invariant(typeof lang === "string", "language must be a string");

  await loadLocale(store, lang);
}

export default {boot, queueLocaleDownload, languageChanged};
