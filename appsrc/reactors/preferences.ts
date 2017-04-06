
import {Watcher} from "./watcher";

import pathmaker from "../util/pathmaker";
import {camelifyObject} from "../util/format";
import sf from "../util/sf";
import partitionForUser from "../util/partition-for-user";

import * as actions from "../actions";
import {MODAL_RESPONSE} from "../constants/action-types";

import mklog from "../util/log";
const log = mklog("preferences");
import {opts} from "../logger";

import "electron";

import {promisedModal} from "./modals";

let saveAtomicInvocations = 0;

import {initialState} from "../reducers/preferences";

import {IClearBrowsingDataParams} from "../components/modal-widgets/clear-browsing-data";

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    let prefs: any = {};

    try {
      const contents = await sf.readFile(pathmaker.preferencesPath(), {encoding: "utf8"});
      prefs = camelifyObject(JSON.parse(contents));
    } catch (err) {
      log(opts, `while importing preferences: ${err}`);
    }

    log(opts, "imported preferences: ", JSON.stringify(prefs, null, 2));
    store.dispatch(actions.updatePreferences(prefs));
    store.dispatch(actions.preferencesLoaded({...initialState, ...prefs}));
  });

  watcher.on(actions.updatePreferences, async (store, action) => {
    const prefs = store.getState().preferences;

    // write prefs atomically
    const file = pathmaker.preferencesPath();
    const tmpPath = file + ".tmp" + (saveAtomicInvocations++);
    await sf.writeFile(tmpPath, JSON.stringify(prefs), {encoding: "utf8"});
    await sf.rename(tmpPath, file);
  });

  watcher.on(actions.clearBrowsingDataRequest, async (store, action) => {
    const response = await promisedModal(store, {
      title: ["preferences.advanced.clear_browsing_data"],
      message: "",
      widget: "clear-browsing-data",
      widgetParams: {} as IClearBrowsingDataParams,
      buttons: [
        {
          label: ["prompt.clear_browsing_data.clear"],
          action: actions.modalResponse({}),
          actionSource: "widget",
        },
        "cancel",
      ],
    });

    if (response.type !== MODAL_RESPONSE) {
      // modal was closed
      return;
    }

    store.dispatch(actions.clearBrowsingData({
      cache: response.payload.cache,
      cookies: response.payload.cookies,
    }));
  });

  watcher.on(actions.clearBrowsingData, async (store, action) => {
    const promises: Promise<any>[] = [];

    const userId = store.getState().session.credentials.me.id;

    const session = require("electron").session;
    const ourSession = session.fromPartition(partitionForUser(String(userId))) as Electron.Session;

    if (action.payload.cache) {
      promises.push(new Promise((resolve, reject) => {
        ourSession.clearCache(resolve);
      }));
    }

    if (action.payload.cookies) {
      promises.push(new Promise((resolve, reject) => {
        ourSession.clearStorageData({
          storages: ["cookies"],
        }, resolve);
      }));
    }

    await Promise.all(promises);

    store.dispatch(actions.statusMessage({
      message: ["prompt.clear_browsing_data.notification"],
    }));
  });
}
