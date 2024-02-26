// This file is the entry point for the main (browser) process

import env from "main/env";

import { legacyMarketPath, mainLogPath } from "main/util/paths";
import { getImageURL, getInjectURL } from "main/util/resources";
import { isItchioURL } from "main/util/url";
import { userAgent } from "main/util/useragent";

import { actions } from "common/actions";
import { partitionForUser } from "common/util/partition-for-user";
import {
  app,
  dialog,
  globalShortcut,
  ipcMain,
  protocol,
  session,
  App,
  BrowserWindow,
  IpcMainEvent,
  OpenDialogOptions,
} from "electron";

import { loadPreferencesSync } from "main/reactors/preboot/load-preferences";
import { Store } from "common/types";
import { AsyncIpcHandlers, SyncIpcHandlers } from "common/ipc";
import { mainLogger } from "main/logger";

const appUserModelId = "com.squirrel.itch.itch";

const registerSync = (
  syncHandlers: SyncIpcHandlers,
  asyncHandlers: AsyncIpcHandlers
): void => {
  Object.entries(syncHandlers).forEach(([eventName, callback]): void => {
    ipcMain.on(eventName, (event: IpcMainEvent, arg: any): void => {
      event.returnValue = callback(arg);
    });
  });
  Object.entries(asyncHandlers).forEach(([eventName, callback]): void => {
    ipcMain.handle(
      eventName,
      (event: IpcMainEvent, arg: any): ReturnType<typeof callback> => {
        return callback(arg);
      }
    );
  });
};

// App lifecycle

export function main() {
  mainLogger.info(
    `${env.appName}@${app.getVersion()} on electron@${
      process.versions.electron
    } in ${env.production ? "production" : "development"}`
  );

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

  if (process.env.ITCH_IGNORE_CERTIFICATE_ERRORS === "1") {
    app.commandLine.appendSwitch("ignore-certificate-errors");
  }

  // Run the GPU process as a thread in the browser process for linux.
  if (process.platform === "linux") {
    app.commandLine.appendSwitch("in-process-gpu");
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
  ]);

  let store: Store = require("main/store").default;

  let onReady = () => {
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
        getInjectURL,
        legacyMarketPath,
        mainLogPath,
        onCaptchaResponse: (response) => {
          if (response) {
            store.dispatch(actions.closeCaptchaModal({ response }));
          }
          return null;
        },
      },
      {
        showOpenDialog: async (options: OpenDialogOptions) => {
          const { filePaths } = await dialog.showOpenDialog(
            BrowserWindow.getFocusedWindow(),
            options
          );
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
          return app.getGPUFeatureStatus;
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

    store.dispatch(
      actions.processUrlArguments({
        args: process.argv,
      })
    );

    globalShortcut.register("Control+Alt+Backspace", function () {
      store.dispatch(actions.forceCloseLastGame({}));
    });

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

    app.on("web-contents-created", (_event, contents) => {
      contents.on("will-navigate", (e, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        if (
          !parsedUrl.origin.endsWith(".itch.io") &&
          !parsedUrl.origin.endsWith("/itch.io")
        ) {
          e.preventDefault();
          store.dispatch(actions.openInExternalBrowser({ url: navigationUrl }));
        }
      });
    });

    store.dispatch(actions.preboot({}));

    setInterval(() => {
      try {
        store.dispatch(actions.tick({}));
      } catch (e) {
        mainLogger.error(`While dispatching tick: ${e.stack}`);
      }
    }, 1 * 1000 /* every second */);
  };
  app.on("ready", onReady);

  app.on("will-finish-launching", () => {
    app.setAppUserModelId(appUserModelId);
  });

  // macOS (Info.pList)
  app.on("open-url", (e: Event, url: string) => {
    if (isItchioURL(url)) {
      // otherwise it'll err -600
      e.preventDefault();
      store.dispatch(actions.handleItchioURI({ uri: url }));
    }
  });
}
