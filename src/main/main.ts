// This file is the entry point for the main (browser) process

import env from "common/env";

import { isItchioURL } from "common/util/url";

import { actions } from "common/actions";
import { app, protocol, globalShortcut } from "electron";

import { loadPreferencesSync } from "main/reactors/preboot/load-preferences";
import { Store } from "common/types";
import { mainLogger } from "main/logger";

const appUserModelId = "com.squirrel.itch.itch";

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
