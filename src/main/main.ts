import { getErrorStack } from "common/butlerd/errors";
// This file is the entry point for the main (browser) process

import env from "main/env";

import { promises as fsPromises } from "fs";
import { cpu, graphics, osInfo } from "systeminformation";

import { legacyMarketPath, mainLogPath } from "main/util/paths";
import { getImageURL } from "main/util/resources";
import { isItchioURL } from "main/util/url";
import { isItchioOrigin } from "common/constants/urls";
import { userAgent } from "main/util/useragent";
import {
  restrictSessionPermissions,
  WEBVIEW_PERMISSIONS,
} from "main/util/session-permissions";
import { isTrustedFrame } from "main/util/trusted-sender";

import { actions } from "common/actions";
import { partitionForUser } from "common/util/partition-for-user";
import {
  app,
  dialog,
  ipcMain,
  net,
  protocol,
  session,
  App,
  BrowserWindow,
  IpcMainEvent,
  IpcMainInvokeEvent,
  OpenDialogOptions,
} from "electron";

import { loadPreferencesSync } from "main/reactors/preboot/load-preferences";
import { Store } from "common/types";
import {
  AsyncIpcHandlers,
  BROWSER_REFRESH_PAGE_CHANNEL,
  SyncIpcHandlers,
} from "common/ipc";
import { getInjectPath } from "main/util/resources";
import { findWebContentsTab } from "main/reactors/web-contents/web-contents-state";
import { mainLogger } from "main/logger";
import { stopForwarding } from "common/util/store-sync";

const appUserModelId = "io.itch.itch";

const registerSync = (
  syncHandlers: SyncIpcHandlers,
  asyncHandlers: AsyncIpcHandlers
): void => {
  // handlers are looked up dynamically by event name, so the argument
  // type can't be tied to a specific handler here
  Object.entries(syncHandlers).forEach(
    ([eventName, callback]: [string, (arg: any) => any]): void => {
      ipcMain.on(eventName, (event: IpcMainEvent, arg: any): void => {
        if (!isTrustedFrame(event.senderFrame)) {
          event.returnValue = undefined;
          return;
        }
        event.returnValue = callback(arg);
      });
    }
  );
  Object.entries(asyncHandlers).forEach(
    ([eventName, callback]: [string, (arg: any) => Promise<any>]): void => {
      ipcMain.handle(
        eventName,
        (event: IpcMainInvokeEvent, arg: any): Promise<any> => {
          if (!isTrustedFrame(event.senderFrame)) {
            throw new Error(`Untrusted sender for ${eventName}`);
          }
          return callback(arg);
        }
      );
    }
  );
};

// App lifecycle

export function main() {
  mainLogger.info(
    `${env.appName}@${app.getVersion()} on electron@${
      process.versions.electron
    } in ${env.production ? "production" : "development"}`
  );

  const chromeDevToolsPort = process.env.ITCH_CHROME_DEVTOOLS_PORT;
  if (env.development && chromeDevToolsPort) {
    app.commandLine.appendSwitch("remote-debugging-port", chromeDevToolsPort);
    app.commandLine.appendSwitch("remote-debugging-address", "127.0.0.1");
    mainLogger.info(
      `Chrome DevTools Protocol listening on 127.0.0.1:${chromeDevToolsPort}`
    );
  }

  if (process.env.CAPSULE_LIBRARY_PATH) {
    // disable acceleration when captured by capsule
    app.disableHardwareAcceleration();
  } else {
    try {
      const prefs = loadPreferencesSync();
      if (prefs.disableHardwareAcceleration) {
        app.disableHardwareAcceleration();
      }
    } catch (e) {
      // oh well
    }
  }

  if (env.development && process.env.ITCH_IGNORE_CERTIFICATE_ERRORS === "1") {
    app.commandLine.appendSwitch("ignore-certificate-errors");
  }
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "itch-cave",
      privileges: {
        standard: true,
        secure: true,
        bypassCSP: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
    {
      scheme: "itch",
      privileges: {
        standard: true,
        secure: true,
        bypassCSP: true,
        supportFetchAPI: true,
        corsEnabled: true,
      },
    },
    {
      scheme: "itch-shell",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
      },
    },
  ]);

  let store: Store = require("main/store").default;

  let onReady = () => {
    app.userAgentFallback = userAgent();

    registerSync(
      {
        buildApp: (_x) => {
          return {
            name: app.getName(),
            isPackaged: app.isPackaged,
          };
        },
        userAgent: (_x) => {
          return userAgent();
        },
        getImageURL,
        legacyMarketPath,
        mainLogPath,
      },
      {
        showOpenDialog: async (options: OpenDialogOptions) => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          const { filePaths } = focusedWindow
            ? await dialog.showOpenDialog(focusedWindow, options)
            : await dialog.showOpenDialog(options);
          return filePaths;
        },
        getUserCacheSize: (userId: number) => {
          const ourSession = session.fromPartition(
            partitionForUser(String(userId)),
            { cache: true }
          );

          return ourSession.getCacheSize();
        },
        getGPUFeatureStatus: async (_x) => {
          return app.getGPUFeatureStatus();
        },
        sysinfoReport: async (_x) => {
          const attempt = async <T>(
            fn: () => Promise<T>
          ): Promise<T | string> => {
            try {
              return await fn();
            } catch (e) {
              return `Could not get info: ${e}`;
            }
          };

          const [cpuInfo, graphicsInfo, osInfoResult] = await Promise.all([
            attempt(async () => {
              const { manufacturer, brand, vendor, speed, cores } = await cpu();
              return { manufacturer, brand, vendor, speed, cores };
            }),
            attempt(async () => {
              const { controllers } = await graphics();
              return {
                controllers: controllers.map(({ model, vendor, vram }) => ({
                  model,
                  vendor,
                  vram,
                })),
              };
            }),
            attempt(async () => {
              const { platform, arch, distro, release, codename, logofile } =
                await osInfo();
              return { platform, arch, distro, release, codename, logofile };
            }),
          ]);

          return { cpu: cpuInfo, graphics: graphicsInfo, osInfo: osInfoResult };
        },
        readTextFile: (path: string) => {
          return fsPromises.readFile(path, { encoding: "utf8" });
        },
        fetchGitHubReleases: async (url: string) => {
          if (!url.startsWith("https://api.github.com/")) {
            throw new Error("Only GitHub API URLs are allowed");
          }
          const response = await net.fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        },
      }
    );

    if (!env.integrationTests) {
      const singleInstanceLockAcquired = app.requestSingleInstanceLock();
      if (!singleInstanceLockAcquired) {
        app.exit(0);
        return;
      }
      app.on("second-instance", (event, argv, cwd) => {
        // we only get inside this callback when another instance
        // is launched - so this executes in the context of the main instance
        store.dispatch(
          actions.processUrlArguments({
            args: argv,
          })
        );
        store.dispatch(actions.focusWind({ wind: "root" }));
      });
    }

    // launchers (itch-setup --run-game) pass the profile via the
    // environment rather than argv, keeping it out of Chromium's switch
    // parsing; env also can't reach an already-running instance, which
    // keeps whatever profile state it has
    const startupProfileId = parseInt(process.env.ITCH_PROFILE_ID || "", 10);
    if (!isNaN(startupProfileId) && startupProfileId > 0) {
      // don't leak into butlerd and the games it launches
      delete process.env.ITCH_PROFILE_ID;
      store.dispatch(
        actions.useSavedLoginById({ profileId: startupProfileId })
      );
    }
    store.dispatch(
      actions.processUrlArguments({
        args: process.argv,
      })
    );

    // Emitted when the application is activated. Various actions can trigger
    // this event, such as launching the application for the first time,
    // attempting to re-launch the application when it's already running, or
    // clicking on the application's dock or taskbar icon.
    app.on("activate", () => {
      store.dispatch(actions.focusWind({ wind: "root" }));
    });

    app.on("before-quit", (e) => {
      e.preventDefault();
      store.dispatch(actions.quit({}));
    });

    // pokes from the in-app browser bridge (inject-browser.ts). No payload
    // is read; the sender must be the main frame of a tracked browser tab,
    // on an itch.io origin, and pokes are throttled per webContents.
    const lastRefreshPokes = new Map<number, number>();
    ipcMain.on(BROWSER_REFRESH_PAGE_CHANNEL, (event) => {
      const frame = event.senderFrame;
      if (!frame || frame !== event.sender.mainFrame) {
        return;
      }
      if (!isItchioOrigin(frame.url)) {
        return;
      }
      const loc = findWebContentsTab(event.sender.id);
      if (!loc) {
        return;
      }
      const now = Date.now();
      if (now - (lastRefreshPokes.get(event.sender.id) ?? 0) < 250) {
        return;
      }
      lastRefreshPokes.set(event.sender.id, now);
      store.dispatch(
        actions.analyzePage({
          wind: loc.wind,
          tab: loc.tab,
          url: event.sender.getURL(),
        })
      );
    });

    app.on("web-contents-created", (_event, contents) => {
      mainLogger.info(
        `web-contents-created: id=${
          contents.id
        } type=${contents.getType()} url=${contents.getURL()}`
      );

      // fires on the embedding window; our only webview (the in-app
      // browser) runs no node and only our own preload, never a
      // page-supplied one
      contents.on("will-attach-webview", (_e, webPreferences) => {
        webPreferences.preload = getInjectPath("browser");
        webPreferences.nodeIntegration = false;
        webPreferences.contextIsolation = true;
      });

      // navigation protection to prevent non itchio links from opening in the app browser
      if (contents.getType() === "window") {
        return;
      } // no checks on main window

      if (contents.getType() === "webview") {
        restrictSessionPermissions(contents.session, WEBVIEW_PERMISSIONS);
      }

      contents.on("will-navigate", (e, navigationUrl) => {
        if (!isItchioOrigin(navigationUrl)) {
          e.preventDefault();
          store.dispatch(actions.openInExternalBrowser({ url: navigationUrl }));
        }
      });
    });

    store.dispatch(actions.preboot({}));

    setInterval(() => {
      try {
        // Use stopForwarding to prevent tick from being synced to renderers
        store.dispatch(stopForwarding(actions.tick({})));
      } catch (e) {
        mainLogger.error(`While dispatching tick: ${getErrorStack(e)}`);
      }
    }, 1 * 1000 /* every second */);
  };
  app.on("ready", onReady);

  app.on("will-finish-launching", () => {
    app.setAppUserModelId(appUserModelId);
  });

  // macOS (Info.pList)
  app.on("open-url", (e, url) => {
    if (isItchioURL(url)) {
      // otherwise it'll err -600
      e.preventDefault();
      store.dispatch(actions.handleItchioURI({ uri: url }));
    }
  });
}
