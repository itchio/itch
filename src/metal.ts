// This file is the entry point for the main (browser) process

let rt;
if (process.env.ITCH_TIME_REQUIRE === "1") {
  rt = require("require-times")([".js", ".ts", ".tsx"]);
  rt.start();
}

if (process.env.NODE_ENV !== "production") {
  require("./custom-hmr-runtime.js");
}

import env from "./env";
import logger from "./logger";

import autoUpdaterStart from "./util/auto-updater";
import { isItchioURL } from "./util/url";

import { actions } from "./actions";
import { app, protocol, globalShortcut } from "electron";

logger.info(
  `${env.appName} ${app.getVersion()} on electron ${
    process.versions.electron
  } in ${env.name}`
);

import { loadPreferencesSync } from "./reactors/preboot/load-preferences";
import { IStore } from "./types";

const appUserModelId = "com.squirrel.itch.itch";

async function autoUpdate(autoUpdateDone: () => void) {
  const quit = await autoUpdaterStart();
  if (quit) {
    // squirrel on win32 sometimes requires exiting as early as possible
    process.exit(0);
  } else {
    autoUpdateDone();
  }
}

autoUpdate(autoUpdateDone); // no need to wait for app.on('ready')

// App lifecycle

function autoUpdateDone() {
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

  // devtools don't work with mixed sandbox mode -
  // enable it only in production and only when the
  // `DEVTOOLS` environment variable is not specified
  if (env.name === "production") {
    app.enableMixedSandbox();
  }

  if (process.env.ITCH_IGNORE_CERTIFICATE_ERRORS === "1") {
    app.commandLine.appendSwitch("ignore-certificate-errors");
  }
  protocol.registerStandardSchemes(["itch-cave"]);

  let store: IStore;
  store = require("./store/metal-store").default;

  let onReady = () => {
    if (process.env.NODE_ENV !== "test") {
      const shouldQuit = app.makeSingleInstance((argv, cwd) => {
        // we only get inside this callback when another instance
        // is launched - so this executes in the context of the main instance
        store.dispatch(
          actions.processUrlArguments({
            args: argv,
          })
        );
        store.dispatch(actions.focusWindow({}));
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

    if (rt) {
      rt.end();
    }

    store.dispatch(actions.languageSniffed({ lang: app.getLocale() }));
    store.dispatch(actions.preboot({}));

    setInterval(() => {
      try {
        store.dispatch(actions.tick({}));
      } catch (e) {
        logger.error(`While dispatching tick: ${e.stack}`);
      }
    }, 1000 /* each second */);
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
