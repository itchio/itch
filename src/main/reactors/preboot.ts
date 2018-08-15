import { actions } from "common/actions";
import { NET_PARTITION_NAME } from "common/constants/net";
import env from "common/env";
import { elapsed } from "common/format/datetime";
import { ProxySource, SystemState } from "common/types";
import { Watcher } from "common/util/watcher";
import { app, CertificateVerifyProcRequest } from "electron";
import { mainLogger } from "main/logger";
import loadPreferences from "main/reactors/preboot/load-preferences";
import { modals } from "common/modals";
import { applyProxySettings } from "main/reactors/proxy";
import { itchPlatform } from "common/os/platform";
import { arch } from "main/os/arch";

const logger = mainLogger.child(__filename);

let testProxy = false;
let proxyTested = false;

export default function(watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    let dispatchedBoot = false;

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
        const { session } = require("electron");
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

      store.dispatch(actions.boot({}));
      dispatchedBoot = true;

      if (env.production && env.appName === "itch") {
        try {
          app.setAsDefaultProtocolClient("itchio");
          app.setAsDefaultProtocolClient("itch");
        } catch (e) {
          logger.error(
            `Could not set app as default protocol client: ${e.stack ||
              e.message ||
              e}`
          );
        }
      }
    } catch (e) {
      throw e;
    } finally {
      const t2 = Date.now();
      logger.info(`preboot ran in ${elapsed(t1, t2)}`);
    }

    if (!dispatchedBoot) {
      store.dispatch(actions.boot({}));
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
