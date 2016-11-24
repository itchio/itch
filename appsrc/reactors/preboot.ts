
import {Watcher} from "./watcher";
import * as actions from "../actions";

import {cleanOldLogs} from "./preboot/clean-old-logs";
import xdgMime from "./preboot/xdg-mime";

import {opts} from "../logger";
import mklog from "../util/log";
const log = mklog("preboot");

export default function (watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    try {
      await cleanOldLogs();
    } catch (e) {
      log(opts, `Could not clean old logs: ${e.stack || e.message || e}`);
    }

    try {
      await xdgMime.registerIfNeeded(opts);
    } catch (e) {
      log(opts, `Could not run xdg-mime: ${e.stack || e.message || e}`);
    }

    try {
      const proxySettings = await new Promise<string>((resolve, reject) => {
        // TODO: move to an action instead
        const {session} = require("electron");
        // resolveProxy accepts strings as well, and URL is not defined here for some reason?
        session.defaultSession.resolveProxy("https://itch.io" as any, resolve);

        setTimeout(function () {
          reject(new Error("proxy resolution timed out"));
        }, 1000);
      });

      if (/PROXY /.test(proxySettings)) {
        log(opts, `Got proxy settings: '${proxySettings}'`);
        const proxy = proxySettings.replace(/PROXY /, "");
        store.dispatch(actions.proxySettingsDetected({proxy}));
      } else {
        log(opts, `No proxy detected`);
      }
    } catch (e) {
      log(opts, `Could not detect proxy settings: ${e ? e.message : "unknown error"}`);
    }

    store.dispatch(actions.boot({}));

    // print various machine specs, see docs/
    const diego = require("../util/diego").default;
    setTimeout(function () {
      diego.hire(opts);
    }, 3000);
  });
}
