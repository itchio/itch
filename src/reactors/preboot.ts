
import {Watcher} from "./watcher";
import * as actions from "../actions";

import {cleanOldLogs} from "./preboot/clean-old-logs";
import xdgMime from "./preboot/xdg-mime";
import visualElements from "./preboot/visual-elements";

import rootLogger from "../logger";
const logger = rootLogger.child({name: "preboot"});
const opts = {logger};

import {ProxySource} from "../types";

import {NET_PARTITION_NAME} from "../api/net";

import {applyProxySettings} from "../reactors/proxy";

let testProxy = false;
let proxyTested = false;

export default function (watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    try {
      await cleanOldLogs();
    } catch (e) {
      logger.error(`Could not clean old logs: ${e.stack || e.message || e}`);
    }

    try {
      await xdgMime.registerIfNeeded(opts);
    } catch (e) {
      logger.error(`Could not run xdg-mime: ${e.stack || e.message || e}`);
    }

    try {
      await visualElements.createIfNeeded(opts);
    } catch (e) {
      logger.error(`Could not run visualElements: ${e.stack || e.message || e}`);
    }

    try {
      const {app} = require("electron");
      app.on("certificate-error", (ev, webContents, url, error, certificate, callback) => {
        // do not trust
        callback(false);

        logger.error(`Certificate error: ${error} issued by ${certificate.issuerName} for ${certificate.subjectName}`);

        store.dispatch(actions.openModal({
          title: `Certificate error: ${error}`,
          message: `There was an error with the certificate for ` +
          `\`${certificate.subjectName}\` issued by \`${certificate.issuerName}\`.\n\n` +
          `Please check your proxy configuration and try again.`,
          detail: `If you ignore this error, the rest of the app might not work correctly.`,
          buttons: [
            {
              label: "Ignore and continue",
              action: actions.closeModal({}),
              className: "secondary",
            },
            {
              label: ["menu.file.quit"],
              action: actions.quit({}),
            },
          ],
        }));
      });
      logger.debug(`Set up certificate error handler`);
    } catch (e) {
      logger.error(`Could not set up certificate error handler: ${e.stack || e.message || e}`);
    }

    try {
      const {session} = require("electron");
      const netSession = session.fromPartition(NET_PARTITION_NAME, {cache: false});

      const envSettings: string =
        process.env.https_proxy ||
        process.env.HTTPS_PROXY ||
        process.env.http_proxy ||
        process.env.HTTP_PROXY;

      let proxySettings = {
        proxy: null as string,
        source: null as ProxySource,
      };

      if (envSettings) {
        logger.info(`Got proxy settings from environment: ${envSettings}`);
        proxySettings = {
          proxy: envSettings,
          source: "env",
        };
        testProxy = true;
      } else {
        const electronProxy = await new Promise<string>((resolve, reject) => {
          // resolveProxy accepts strings as well, and URL is not defined here for some reason?
          session.defaultSession.resolveProxy("https://itch.io" as any, resolve);

          setTimeout(function () {
            reject(new Error("proxy resolution timed out"));
          }, 5000);
        });

        if (/PROXY /.test(electronProxy)) {
          logger.info(`Got proxy settings: '${electronProxy}'`);
          const proxy = electronProxy.replace(/PROXY /, "");
          proxySettings = {
            proxy,
            source: "os",
          };
          testProxy = true;
        } else {
          logger.info(`No proxy detected`);
        }
      }
      store.dispatch(actions.proxySettingsDetected(proxySettings));
      await applyProxySettings(netSession, proxySettings);
    } catch (e) {
      logger.warn(`Could not detect proxy settings: ${e ? e.message : "unknown error"}`);
    }

    store.dispatch(actions.boot({}));

    // print various machine specs, see docs/
    const diego = require("../os/diego").default;
    setTimeout(function () {
      diego.hire(opts);
    }, 3000);
  });

  watcher.on(actions.attemptLogin, async (store, action) => {
    if (!testProxy) {
      return;
    }

    if (proxyTested) {
      return;
    }
    proxyTested = true;

    const {BrowserWindow} = require("electron");
    const win = new BrowserWindow({ show: false });

    win.webContents.on("did-finish-load", () => {
      logger.info(`Test page loaded with proxy successfully!`);
    });
    win.webContents.on("did-fail-load", () => {
      logger.warn(`Test page failed to load with proxy!`);
    });

    logger.info(`Testing proxy by loading a page in a hidden browser window...`);
    win.loadURL("https://itch.io/country");

    setTimeout(() => {
      win.close();
    }, 15 * 1000);
  });
}
