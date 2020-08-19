import { actions } from "common/actions";
import { NET_PARTITION_NAME } from "common/constants/net";
import env from "common/env";
import { elapsed } from "common/format/datetime";
import { ProxySource, SystemState } from "common/types";
import { Watcher } from "common/util/watcher";
import { app, session, protocol, BrowserWindow } from "electron";
import { mainLogger } from "main/logger";
import loadPreferences from "main/reactors/preboot/load-preferences";
import { applyProxySettings } from "main/reactors/proxy";
import { itchPlatform } from "common/os/platform";
import { arch } from "main/os/arch";
import * as path from "path";
import * as fs from "fs";

const logger = mainLogger.child(__filename);

let testProxy = false;
let proxyTested = false;

export default function (watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    let t1 = Date.now();
    try {
      const system: SystemState = {
        appName: app.getName(),
        appVersion: app.getVersion().replace(/\-.*$/, ""),
        platform: itchPlatform(),
        arch: arch(),
        macos: process.platform === "darwin",
        windows: process.platform === "win32",
        linux: process.platform === "linux",
        sniffedLanguage: app.getLocale(),
        homePath: app.getPath("home"),
        userDataPath: app.getPath("userData"),
        proxy: null,
        proxySource: null,
        quitting: false,
      };
      store.dispatch(actions.systemAssessed({ system }));

      try {
        await loadPreferences(store);
      } catch (e) {
        logger.error(
          `Could not load preferences: ${e.stack || e.message || e}`
        );
      }

      try {
        const netSession = session.fromPartition(NET_PARTITION_NAME, {
          cache: false,
        });

        const envSettings: string =
          process.env.https_proxy ||
          process.env.HTTPS_PROXY ||
          process.env.http_proxy ||
          process.env.HTTP_PROXY;

        let proxySettings = {
          proxy: null as string,
          source: "os" as ProxySource,
        };

        if (envSettings) {
          logger.info(`Got proxy settings from environment: ${envSettings}`);
          proxySettings = {
            proxy: envSettings,
            source: "env",
          };
          testProxy = true;
          store.dispatch(actions.proxySettingsDetected(proxySettings));
        }
        await applyProxySettings(netSession, proxySettings);
      } catch (e) {
        logger.warn(
          `Could not detect proxy settings: ${e ? e.message : "unknown error"}`
        );
      }

      if (env.production && env.appName === "itch") {
        try {
          app.setAsDefaultProtocolClient("itchio");
          app.setAsDefaultProtocolClient("itch");
        } catch (e) {
          logger.error(
            `Could not set app as default protocol client: ${
              e.stack || e.message || e
            }`
          );
        }
      } else if (env.appName === "kitch") {
        try {
          app.setAsDefaultProtocolClient("kitchio");
          app.setAsDefaultProtocolClient("kitch");
        } catch (e) {
          logger.error(
            `Could not set app as default protocol client: ${
              e.stack || e.message || e
            }`
          );
        }
      }
    } catch (e) {
      throw e;
    } finally {
      const t2 = Date.now();
      logger.info(`preboot ran in ${elapsed(t1, t2)}`);
    }

    store.dispatch(actions.prebootDone({}));

    let devtoolsPath = process.env.ITCH_REACT_DEVTOOLS_PATH;
    if (!devtoolsPath && env.development) {
      let reactDevtoolsId = "fmkadmapgofadopljbjfkapdkoienihi";
      let devtoolsFolder = path.join(
        app.getPath("home"),
        "AppData",
        "Local",
        "Google",
        "Chrome",
        "User Data",
        "Default",
        "Extensions",
        reactDevtoolsId
      );
      try {
        const files = fs.readdirSync(devtoolsFolder);
        let version = files[0];
        if (version) {
          devtoolsPath = path.join(devtoolsFolder, version);
          logger.info(`Found React devtools at ${devtoolsPath}`);
        }
      } catch (e) {
        logger.warn(`Could not find react devtools at ${devtoolsFolder}: ${e}`);
      }
    }

    if (devtoolsPath) {
      try {
        logger.info(`Adding react devtools from ${devtoolsPath}`);
        BrowserWindow.addDevToolsExtension(devtoolsPath);
      } catch (e) {
        logger.error(`While adding react devtools path: ${e.stack}`);
      }
    }
  });

  watcher.on(actions.log, async (store, action) => {
    const { entry } = action.payload;
    mainLogger.write(entry);
  });

  watcher.on(actions.attemptLogin, async (store, action) => {
    if (!testProxy) {
      return;
    }

    if (proxyTested) {
      return;
    }
    proxyTested = true;

    const { BrowserWindow } = require("electron");
    const win = new BrowserWindow({ show: false });

    win.webContents.on("did-finish-load", () => {
      logger.info(`Test page loaded with proxy successfully!`);
    });
    win.webContents.on("did-fail-load", () => {
      logger.warn(`Test page failed to load with proxy!`);
    });

    logger.info(
      `Testing proxy by loading a page in a hidden browser window...`
    );
    win.loadURL("https://itch.io/country");

    setTimeout(() => {
      win.close();
    }, 15 * 1000);
  });
}
