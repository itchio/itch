
import {Watcher} from "./watcher";

import {preferencesPath, logPath} from "../os/paths";
import * as sf from "../os/sf";
import {camelifyObject} from "../format";
import partitionForUser from "../util/partition-for-user";

import * as actions from "../actions";
import {MODAL_RESPONSE} from "../constants/action-types";

import rootLogger from "../logger";
const logger = rootLogger.child({name: "preferences"});

import {shell, session} from "electron";

import {promisedModal} from "./modals";

let saveAtomicInvocations = 0;

import {initialState} from "../reducers/preferences";

import {IClearBrowsingDataParams} from "../components/modal-widgets/clear-browsing-data";

export default function (watcher: Watcher) {
  watcher.on(actions.boot, async (store, action) => {
    let prefs: any = {};

    try {
      const contents = await sf.readFile(preferencesPath(), {encoding: "utf8"});
      prefs = camelifyObject(JSON.parse(contents));
      logger.debug("imported preferences: ", prefs);
    } catch (err) {
      if (err.code === "ENOENT") {
        logger.info(`no preferences yet. fresh start!`);
      } else {
        logger.warn(`while importing preferences: ${err.stack}`);
      }
    }

    store.dispatch(actions.updatePreferences(prefs));
    store.dispatch(actions.preferencesLoaded({...initialState, ...prefs}));
  });

  watcher.on(actions.updatePreferences, async (store, action) => {
    const prefs = store.getState().preferences;

    // write prefs atomically
    const file = preferencesPath();
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

    const partition = partitionForUser(String(userId));
    const ourSession = session.fromPartition(partition, {});

    logger.debug(`asked to clear browsing data`);

    if (action.payload.cache) {
      logger.debug(`clearing cache for ${partition}`);
      promises.push(new Promise((resolve, reject) => {
        ourSession.clearCache(resolve);
      }));
    }

    if (action.payload.cookies) {
      logger.debug(`clearing cookies for ${partition}`);
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

  watcher.on(actions.openAppLog, async(store, action) => {
    const path = logPath();
    logger.info(`Opening app log at ${path}`);
    shell.openItem(path);
  });
}
