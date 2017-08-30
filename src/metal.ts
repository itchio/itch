// This file is the entry point for the main (browser) process

let rt;
if (process.env.ITCH_TIME_REQUIRE === "1") {
  rt = require("require-times")([".js", ".ts", ".tsx"]);
  rt.start();
}

import env from "./env";
import logger from "./logger";
import { enableLiveReload } from "electron-compile-ftl";

if (env.name === "development") {
  logger.info("Enabling hot-module reload!");
  enableLiveReload({
    strategy: "react-hmr",
    blacklist: ["db", "store", "logger"],
  });
}

import autoUpdaterStart from "./util/auto-updater";
import { isItchioURL } from "./util/url";

import * as actions from "./actions";
import { app, protocol, globalShortcut } from "electron";

logger.info(
  `${env.appName} ${app.getVersion()} on electron ${process.versions
    .electron} in ${env.name}`
);

import { connectDatabase } from "./db";

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

  const store = require("./store/metal-store").default;

  app.on("ready", async function() {
    if (env.name !== "test") {
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
        // app.quit() is the source of all our problems,
        // cf. https://github.com/itchio/itch/issues/202
        app.exit(0);
        return;
      }
    }

    await connectDatabase(store);

    store.dispatch(
      actions.processUrlArguments({
        args: process.argv,
      })
    );

    globalShortcut.register("Control+Alt+Backspace", function() {
      store.dispatch(actions.abortLastGame({}));
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
  });

  app.on("activate", () => {
    store.dispatch(actions.focusWindow({}));
  });

  app.on("will-finish-launching", () => {
    app.setAppUserModelId(appUserModelId);
  });

  app.on("before-quit", (e: Event) => {
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
      store.dispatch(actions.openUrl({ url }));
    } else {
      console.log(`Ignoring non-itchio url: ${url}`);
    }
  });
}
