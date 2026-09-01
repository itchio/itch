import { getErrorStack, getErrorMessage } from "common/butlerd/errors";
import { actions } from "common/actions";
import { NET_PARTITION_NAME } from "common/constants/net";
import env from "main/env";
import { elapsed } from "common/format/datetime";
import { ProxySettings, SystemState } from "common/types";
import { Watcher } from "common/util/watcher";
import { app, session, protocol } from "electron";
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

// Installed layout on Windows: <installRoot>\app-<version>\<appName>.exe,
// with the launcher at <installRoot>\itch-setup.exe. Deriving the root from
// process.execPath handles custom install locations; the default location
// is a fallback for when the app isn't running from a versioned folder.
export function resolveWindowsLauncherPath(appName: string): string | null {
  const candidates = [
    path.resolve(path.dirname(process.execPath), "..", "itch-setup.exe"),
  ];
  const localAppData = process.env.LOCALAPPDATA;
  if (localAppData) {
    candidates.push(path.join(localAppData, appName, "itch-setup.exe"));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  logger.warn(
    `No itch-setup launcher found (tried ${candidates.join(
      ", "
    )}), skipping launcher registration`
  );
  return null;
}

function registerUrlProtocols(appName: string) {
  const protocols =
    appName === "kitch" ? ["kitchio", "kitch"] : ["itchio", "itch"];

  if (process.platform === "win32") {
    // Registering without an explicit path points the protocol at
    // process.execPath, the versioned app-X.Y.Z executable, which goes
    // stale on the next self-update. Route through the stable itch-setup
    // launcher instead. itch-setup registers these itself on install and
    // upgrade; doing it here too heals installs running an older
    // itch-setup.
    const launcherPath = resolveWindowsLauncherPath(appName);
    if (!launcherPath) {
      return;
    }
    for (const proto of protocols) {
      const ok = app.setAsDefaultProtocolClient(proto, launcherPath, [
        "--prefer-launch",
        "--appname",
        appName,
        "--",
      ]);
      if (!ok) {
        logger.warn(`Could not register ${proto}: to ${launcherPath}`);
      }
    }
  } else {
    for (const proto of protocols) {
      if (!app.setAsDefaultProtocolClient(proto)) {
        logger.warn(`Could not register ${proto}: protocol`);
      }
    }
  }
}

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
        quitting: false,
      };
      store.dispatch(actions.systemAssessed({ system }));

      try {
        await loadPreferences(store);
      } catch (e) {
        logger.error(
          `Could not load preferences: ${
            getErrorStack(e) || getErrorMessage(e) || e
          }`
        );
      }

      try {
        const netSession = session.fromPartition(NET_PARTITION_NAME, {
          cache: false,
        });

        const envSettings: string | undefined =
          process.env.https_proxy ||
          process.env.HTTPS_PROXY ||
          process.env.http_proxy ||
          process.env.HTTP_PROXY;

        let proxySettings: ProxySettings = {
          proxy: undefined,
          proxySource: "os",
        };

        if (envSettings) {
          logger.info(`Got proxy settings from environment: ${envSettings}`);
          proxySettings = {
            proxy: envSettings,
            proxySource: "env",
          };
          testProxy = true;
          store.dispatch(
            actions.proxySettingsDetected({
              proxy: envSettings,
              source: "env",
            })
          );
        }
        await applyProxySettings(netSession, proxySettings);
      } catch (e) {
        logger.warn(
          `Could not detect proxy settings: ${
            e ? getErrorMessage(e) : "unknown error"
          }`
        );
      }

      if (
        (env.production && env.appName === "itch") ||
        env.appName === "kitch"
      ) {
        try {
          registerUrlProtocols(env.appName);
        } catch (e) {
          logger.error(
            `Could not set app as default protocol client: ${
              getErrorStack(e) || getErrorMessage(e) || e
            }`
          );
        }
      }
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
        logger.info(`Can't load extension from ${devtoolsPath}`);
        // It's unclear to me which `session` object we need
        // to use now, in order to load the extension, since
        // we can no longer load statically from `BrowserWindow`
        // relevantSession.loadExtension(devtoolsPath);
      } catch (e) {
        logger.error(`While adding react devtools path: ${getErrorStack(e)}`);
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
