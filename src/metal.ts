
// This file is the entry point for the main (browser) process

import {enableLiveReload} from "electron-compile";

import autoUpdater from "./util/auto-updater";
import {isItchioURL} from "./util/url";

import * as actions from "./actions";
import env from "./env";
import {app} from "electron";

const appUserModelId = "com.squirrel.itch.itch";

if (env.name === "test") {
  app.setName("itch-test");
}

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
  const {protocol, app, globalShortcut} = require("electron");

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
    const shouldQuit = app.makeSingleInstance((argv, cwd) => {
      // we only get inside this callback when another instance
      // is launched - so this executes in the context of the main instance
      if (env.name === "test") {
        // if we get this in testing, chromedriver probably
        // timed out while waiting for a command to execute
        // remotely - let's clean up & wait for it to try again
        app.exit(0);
        return;
      }

      handleUrls(argv);
      store.dispatch(actions.focusWindow({}));
    });

    if (shouldQuit) {
      // app.quit() is the source of all our problems,
      // cf. https://github.com/itchio/itch/issues/202
      app.exit(0);
      return;
    }
    handleUrls(process.argv);

    if (env.name === "development") {
      enableLiveReload({strategy: "react-hmr"});
    }

    globalShortcut.register("Control+Alt+Backspace", function () {
      store.dispatch(actions.abortLastGame({}));
    });

    store.dispatch(actions.preboot({}));
  });

  app.on("activate", () => {
    store.dispatch(actions.focusWindow({}));
  });

  app.on("fill-finish-launching", () => {
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
    console.log(`Processing 1 url`);

    if (isItchioURL(url)) {
      // macOS will err -600 if we don't
      e.preventDefault();
      store.dispatch(actions.openUrl({url}));
    } else {
      console.log(`Ignoring non-itchio url: ${url}`);
    }
  });

  // URL handling

  function handleUrls (argv: string[]) {
    console.log(`Processing ${argv.length} potential urls`);

    // Windows (reg.exe), Linux (XDG)
    // open at most one URL
    for (const arg of argv) {
      if (isItchioURL(arg)) {
        store.dispatch(actions.openUrl({url: arg}));
        break;
      }
    }
  }
}
