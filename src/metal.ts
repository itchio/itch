
// This file is the entry point for the main (browser) process

import {enableLiveReload} from "electron-compile";

import autoUpdater from "./util/auto-updater";
import {isItchioURL} from "./util/url";

import * as actions from "./actions";
import env from "./env";
import {app, protocol, globalShortcut} from "electron";

import {connectDatabase} from "./db";

const appUserModelId = "com.squirrel.itch.itch";

// tslint:disable:no-console

async function autoUpdate (autoUpdateDone: () => void) {
  const quit = await autoUpdater.start();
  if (quit) {
    // squirrel on win32 sometimes requires exiting as early as possible
    process.exit(0);
  } else {
    autoUpdateDone();
  }
}

autoUpdate(autoUpdateDone); // no need to wait for app.on('ready')

// App lifecycle

function autoUpdateDone () {
  if (process.env.CAPSULE_LIBRARY_PATH) {
    // disable acceleration when captured by capsule
    app.disableHardwareAcceleration();
  }

  if (process.env.ITCH_IGNORE_CERTIFICATE_ERRORS === "1") {
    app.commandLine.appendSwitch("ignore-certificate-errors");
  }
  protocol.registerStandardSchemes(["itch-cave"]);

  const store = require("./store/metal-store").default;

  app.on("ready", async function () {
    if (env.name !== "test") {
      const shouldQuit = app.makeSingleInstance((argv, cwd) => {
        // we only get inside this callback when another instance
        // is launched - so this executes in the context of the main instance
        store.dispatch(actions.processUrlArguments({
          args: argv,
        }));
        store.dispatch(actions.focusWindow({}));
      });

      if (shouldQuit) {
        // app.quit() is the source of all our problems,
        // cf. https://github.com/itchio/itch/issues/202
        app.exit(0);
        return;
      }
    }

    await connectDatabase(store);

    if (env.name === "development") {
      const logger = require("./logger").default;
      logger.info("Enabling hot-module reload!");
      enableLiveReload({strategy: "react-hmr"});
    }

    store.dispatch(actions.processUrlArguments({
      args: process.argv,
    }));

    globalShortcut.register("Control+Alt+Backspace", function () {
      store.dispatch(actions.abortLastGame({}));
    });

    store.dispatch(actions.preboot({}));
  });

  app.on("activate", () => {
    store.dispatch(actions.focusWindow({}));
  });

  app.on("will-finish-launching", () => {
    app.setAppUserModelId(appUserModelId);
  });

  app.on("before-quit", (e: Event) => {
    console.log(`Got before-quit!`);
    store.dispatch(actions.prepareQuit({}));
  });

  app.on("window-all-closed", (e: Event) => {
    const state = store.getState();
    if (state.ui.mainWindow.quitting) {
      // let normal electron shutdown process continue
      return;
    } else {
      // prevent electron shutdown, we want to remain alive
      e.preventDefault();
    }
  });

  // macOS (Info.pList)
  app.on("open-url", (e: Event, url: string) => {
    if (isItchioURL(url)) {
      // macOS will err -600 if we don't
      e.preventDefault();
      store.dispatch(actions.openUrl({url}));
    } else {
      console.log(`Ignoring non-itchio url: ${url}`);
    }
  });
}
