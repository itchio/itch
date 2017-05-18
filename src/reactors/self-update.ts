
import {Watcher} from "./watcher";

import {app} from "electron";
import os from "../util/os";
import client from "../util/api";
import net from "../util/net";
import {getT} from "../localizer";

import delay from "./delay";

import env from "../env";
import urls from "../constants/urls";

import mklog from "../util/log";
const log = mklog("reactors/self-update");
import {opts} from "../logger";
import format, {DATE_FORMAT} from "../util/format";

import * as actions from "../actions";

const linux = os.itchPlatform() === "linux";

let hadErrors = false;
let autoUpdater: any;

// 2 hours, * 60 = minutes, * 60 = seconds, * 1000 = millis
const UPDATE_INTERVAL = 2 * 60 * 60 * 1000;
const UPDATE_INTERVAL_WIGGLE = 0.2 * 60 * 60 * 1000;

// 5 seconds, * 1000 = millis
const DISMISS_TIME = 5 * 1000;

const QUIET_TIME = 2 * 1000;

const CHECK_FOR_SELF_UPDATES = env.name === "production" || process.env.UP_TO_SCRATCH === "1";

async function returnsZero (cmd: string) {
  return new Promise((resolve, reject) => {
    require("child_process").exec(cmd, {}, (err: any, stdout: string, stderr: string) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function augmentedPlatform () {
  let platform = os.platform();
  if (platform === "linux") {
    if (await returnsZero("/usr/bin/rpm -q -f /usr/bin/rpm")) {
      platform = "rpm";
    } else if (await returnsZero("/usr/bin/dpkg --search /usr/bin/dpkg")) {
      platform = "deb";
    }
  }
  return platform;
}

async function getFeedURL () {
  const base = urls.updateServers[env.channel];
  const platform = (await augmentedPlatform()) + "_" + os.arch();
  const version = app.getVersion();
  return `${base}/update/${platform}/${version}`;
}

export default function (watcher: Watcher) {
  watcher.on(actions.firstWindowReady, async (store, action) => {
    if (!CHECK_FOR_SELF_UPDATES) {
      return;
    }

    try {
      autoUpdater = require("electron").autoUpdater;
      autoUpdater.on("error", (ev: any, err: string) => {
        hadErrors = true;
        const environmentSetManually = !!process.env.NODE_ENV;
        if (/^Could not get code signature/.test(err) &&
            (env.name === "development" || environmentSetManually)) {
          // electron-prebuilt isn't signed, we know you can't work Squirrel.mac, don't worry
          log(opts, "Ignoring Squirrel.mac complaint");
        } else {
          store.dispatch(actions.selfUpdateError({message: err}));
        }
      });
      log(opts, "Installed!");
    } catch (e) {
      log(opts, `While installing: ${e.message}`);
      autoUpdater = null;
      return;
    }

    const feedUrl = await getFeedURL();
    log(opts, `Update feed: ${feedUrl}`);
    autoUpdater.setFeedURL(feedUrl);

    autoUpdater.on("checking-for-update", () => store.dispatch(actions.checkingForSelfUpdate({})));
    autoUpdater.on("update-downloaded", (ev: any, releaseNotes: string, releaseName: string) => {
      log(opts, `update downloaded, release name: '${releaseName}'`);
      log(opts, `release notes: \n'${releaseNotes}'`);
      store.dispatch(actions.selfUpdateDownloaded(releaseName));
    });

    setTimeout(() => store.dispatch(actions.checkForSelfUpdate({})), QUIET_TIME);

    while (true) {
      try {
        await delay(UPDATE_INTERVAL + Math.random() + UPDATE_INTERVAL_WIGGLE);
        store.dispatch(actions.checkForSelfUpdate({}));
      } catch (e) {
        log(opts, `While doing regularly self-update check: ${e}`);
      }
    }
  });

  watcher.on(actions.checkForSelfUpdate, async (store, action) => {
    log(opts, "Checking...");
    const uri = await getFeedURL();

    try {
      const resp = await net.request("get", uri);

      log(opts, `HTTP GET ${uri}: ${resp.statusCode}`);
      if (resp.statusCode === 200) {
        const downloadSelfUpdates = store.getState().preferences.downloadSelfUpdates;

        if (autoUpdater && !hadErrors && downloadSelfUpdates && !linux) {
          store.dispatch(actions.selfUpdateAvailable({spec: resp.body, downloading: true}));
          autoUpdater.checkForUpdates();
        } else {
          store.dispatch(actions.selfUpdateAvailable({spec: resp.body, downloading: false}));
        }
      } else if (resp.statusCode === 204) {
        store.dispatch(actions.selfUpdateNotAvailable({uptodate: true}));
        await delay(DISMISS_TIME);
        store.dispatch(actions.dismissStatus({}));
      } else {
        store.dispatch(actions.selfUpdateError({message: `While trying to reach update server: ${resp.status}`}));
      }
    } catch (e) {
      if (client.isNetworkError(e)) {
        log(opts, "Seems like we have no network connectivity, skipping self-update check");
        store.dispatch(actions.selfUpdateNotAvailable({uptodate: false}));
      } else {
        log(opts, `Server-side error on HTTP GET ${uri}`);
        store.dispatch(actions.selfUpdateError({message: `While trying to reach update server: ${e.message || e}`}));
      }
    }
  });

  watcher.on(actions.applySelfUpdateRequest, async (store, action) => {
    const {strings, lang} = store.getState().i18n;
    const spec = store.getState().selfUpdate.downloaded;
    if (!spec) {
      log(opts, "Asked to apply update, but nothing downloaded? bailing out...");
      return;
    }

    const pubDate = new Date(Date.parse(spec.pub_date));
    const t = getT(strings, lang);

    store.dispatch(actions.openModal({
      title: ["prompt.self_update_ready.title", {version: spec.name}],
      message: ["prompt.self_update_ready.message", {
        restart: t("prompt.self_update_ready.action.restart"),
      }],
      detail: ["prompt.self_update_ready.detail", {
        notes: spec.notes,
        pubDate: format.date(pubDate, DATE_FORMAT, lang),
      }],
      buttons: [
        {
          label: ["prompt.self_update_ready.action.restart"],
          action: actions.applySelfUpdate({}),
          icon: "repeat",
        },
        {
          label: ["prompt.self_update_ready.action.snooze"],
          action: actions.snoozeSelfUpdate({}),
          className: "secondary",
        },
      ],
    }));
  });

  watcher.on(actions.applySelfUpdate, async (store, action) => {
    if (!autoUpdater) {
      log(opts, "not applying self update, got no auto-updater");
      return;
    }

    log(opts, "Preparing for restart...");
    store.dispatch(actions.quitAndInstall({}));
  });

  watcher.on(actions.selfUpdateError, async (store, action) => {
    const error = action.payload;
    log(opts, `Error: ${error.message}`);
  });

  watcher.on(actions.showAvailableSelfUpdate, async (store, action) => {
    const spec = store.getState().selfUpdate.available;
    if (!spec) {
      log(opts, "Asked to show available self-update but there wasn\'t any");
      store.dispatch(actions.dismissStatus({}));
      return;
    }
    const pubDate = new Date(spec.pub_date);
    const lang = store.getState().i18n.lang;

    const messageString = `prompt.self_update.message.${os.itchPlatform()}`;

    store.dispatch(actions.openModal({
      title: ["prompt.self_update.title", {version: spec.name}],
      message: [messageString],
      detail: ["prompt.self_update.detail", {notes: spec.notes, pubDate: format.date(pubDate, DATE_FORMAT, lang)}],
      buttons: [
        {
          label: ["prompt.self_update.action.download"],
          action: [
            actions.openUrl({url: spec.url}),
            actions.dismissStatus({}),
          ],
          icon: "download",
        },
        {
          label: ["prompt.self_update.action.view"],
          action: [
            actions.openUrl({url: urls.releasesPage}),
            actions.dismissStatus({}),
          ],
          className: "secondary",
          icon: "earth",
        },
        {
          label: ["prompt.self_update.action.dismiss"],
          action: actions.dismissStatus({}),
          className: "secondary",
        },
      ],
    }));
  });
}
