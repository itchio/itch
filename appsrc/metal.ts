
// This file is the entry point for the main (browser) process

import "./boot/sourcemaps";
import "./boot/bluebird";
import "./boot/crash";
import "./boot/env";
import "./boot/fs";

import autoUpdater from "./util/auto-updater";
import {isItchioURL} from "./util/url";

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
  if (process.env.PROFILE_REQUIRE === "1") {
    try {
      require("time-require");
    } catch (e) {
      console.log(`No require profiling: ${e.message}`);
    }
  }

  const {app, globalShortcut} = require("electron");

  const {
    preboot,
    prepareQuit,
    focusWindow,
    openUrl,
    abortLastGame,
  } = require("./actions");
  const store = require("./store").default;

  app.on("ready", async function () {
    const shouldQuit = app.makeSingleInstance((argv, cwd) => {
      // we only get inside this callback when another instance
      // is launched - so this executes in the context of the main instance
      handleUrls(argv);
      store.dispatch(focusWindow());
    });

    if (shouldQuit) {
      // app.quit() is the source of all our problems,
      // cf. https://github.com/itchio/itch/issues/202
      process.exit(0);
      return;
    }
    handleUrls(process.argv);

    store.dispatch(preboot());

    globalShortcut.register("Control+Alt+Backspace", function () {
      store.dispatch(abortLastGame());
    });
  });

  app.on("activate", () => {
    store.dispatch(focusWindow());
  });

  app.on("before-quit", (e: Event) => {
    console.log(`Got before-quit!`);
    store.dispatch(prepareQuit());
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
      store.dispatch(openUrl(url));
    } else {
      console.log(`Ignoring non-itchio url: ${url}`);
    }
  });

  // URL handling

  function handleUrls (argv: string[]) {
    // Windows (reg.exe), Linux (XDG)
    argv.forEach((arg) => {
      // XXX should we limit to one url at most ?
      if (isItchioURL(arg)) {
        store.dispatch(openUrl(arg));
      }
    });
  }
}
