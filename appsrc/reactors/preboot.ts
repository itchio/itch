
import {Watcher} from "./watcher";
import * as actions from "../actions";

import {cleanOldLogs} from "./preboot/clean-old-logs";
import xdgMime from "./preboot/xdg-mime";

import {opts} from "../logger";
import mklog from "../util/log";
const log = mklog("preboot");

import {applyProxySettings} from "../reactors/proxy";

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
      const {session} = require("electron");

      const envSettings: string =
        process.env.https_proxy ||
        process.env.HTTPS_PROXY ||
        process.env.http_proxy ||
        process.env.HTTP_PROXY;

      if (envSettings) {
        log(opts, `Got proxy settings from environment: ${envSettings}`);
        const proxySettings = {
          proxy: envSettings,
          source: "env",
        };
        store.dispatch(actions.proxySettingsDetected(proxySettings));
        await applyProxySettings(session.defaultSession, proxySettings);
      } else {
        const proxySettings = await new Promise<string>((resolve, reject) => {
          // resolveProxy accepts strings as well, and URL is not defined here for some reason?
          session.defaultSession.resolveProxy("https://itch.io" as any, resolve);

          setTimeout(function () {
            reject(new Error("proxy resolution timed out"));
          }, 1000);
        });

        if (/PROXY /.test(proxySettings)) {
          log(opts, `Got proxy settings: '${proxySettings}'`);
          const proxy = proxySettings.replace(/PROXY /, "");
          store.dispatch(actions.proxySettingsDetected({proxy, source: "os"}));
        } else {
          log(opts, `No proxy detected`);
        }
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
