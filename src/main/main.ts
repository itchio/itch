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

  if (env.production) {
    app.enableMixedSandbox();
  }

  // cf. https://github.com/itchio/itch/issues/2026
  app.commandLine.appendSwitch("ignore-connections-limit", "127.0.0.1");

  if (process.env.ITCH_IGNORE_CERTIFICATE_ERRORS === "1") {
    app.commandLine.appendSwitch("ignore-certificate-errors");
  }
  protocol.registerStandardSchemes(["itch-cave"]);

  let store: Store = require("main/store").default;

  let onReady = () => {
    if (!env.integrationTests) {
      const shouldQuit = app.makeSingleInstance((argv, cwd) => {
        // we only get inside this callback when another instance
        // is launched - so this executes in the context of the main instance
        store.dispatch(
          actions.processUrlArguments({
            args: argv,
          })
        );
        store.dispatch(actions.focusWind({ wind: "root" }));
      });
      if (shouldQuit) {
        app.exit(0);
        return;
      }
    }

    store.dispatch(
      actions.processUrlArguments({
        args: process.argv,
      })
    );

    globalShortcut.register("Control+Alt+Backspace", function() {
      store.dispatch(actions.forceCloseLastGame({}));
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
