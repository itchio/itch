import { Watcher } from "./watcher";

import { createSelector } from "reselect";

import { makeLabel } from "../util/navigation";
import env from "../env";

import * as sf from "../os/sf";

import { darkMineShaft } from "../constants/colors";
import { app, BrowserWindow } from "electron";
import config from "../util/config";
import { getImagePath } from "../os/resources";
import * as os from "../os";
import { resolve } from "path";
import * as invariant from "invariant";
import { debounce } from "underscore";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "main-window" });

import { t } from "../format";
import * as actions from "../actions";

let createLock = false;
let quitting = false;
let firstWindow = true;

type AppCommand = "browser-backward" | "browser-forward";

const BOUNDS_CONFIG_KEY = "main_window_bounds";
const MAXIMIZED_CONFIG_KEY = "main_window_maximized";

const macOs = os.platform() === "darwin";

import { IAppState, IStore } from "../types";

async function createWindow(store: IStore, hidden: boolean) {
  if (createLock) {
    return;
  }
  createLock = true;

  const userBounds = config.get(BOUNDS_CONFIG_KEY) || {};
  const bounds = {
    x: -1,
    y: -1,
    width: 1250,
    height: 720,
    ...userBounds,
  };
  const { width, height } = bounds;
  const center = bounds.x === -1 && bounds.y === -1;
  let iconName = "icon";
  if (process.platform === "win32") {
    iconName = "icon-32";
  }

  const iconPath = getImagePath(
    "window/" + env.appName + "/" + iconName + ".png",
  );

  let opts: Electron.BrowserWindowConstructorOptions = {
    title: app.getName(),
    icon: iconPath,
    width,
    height,
    center,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: darkMineShaft,
    titleBarStyle: "hidden",
    frame: false,
  };
  const window = new BrowserWindow(opts);

  if (os.platform() === "darwin") {
    try {
      app.dock.setIcon(iconPath);
    } catch (err) {
      logger.warn(`Could not set dock icon: ${err.stack}`);
    }
  }

  if (!center) {
    window.setPosition(bounds.x, bounds.y);
  }
  ensureWindowInsideDisplay(window);

  window.on("close", (e: any) => {
    logger.debug("Main window being closed");
    if (quitting) {
      logger.debug("Quitting, letting main window close");
      // alright alright you get to close
      return;
    }

    const prefs = store.getState().preferences || { closeToTray: true };

    let { closeToTray } = prefs;
    if (env.name === "test") {
      // always let app close in testing
      closeToTray = false;
    }

    if (closeToTray) {
      logger.debug("Close to tray enabled");
    } else {
      logger.debug("Close to tray disabled, quitting!");
      process.nextTick(() => {
        store.dispatch(actions.quit({}));
      });
      return;
    }

    if (!window.isVisible()) {
      logger.info("Main window hidden, letting it close");
      // timeout elapsed and still not shown - it's a closin'!
      return;
    }

    if (!prefs.gotMinimizeNotification) {
      store.dispatch(
        actions.updatePreferences({
          gotMinimizeNotification: true,
        }),
      );

      const i18n = store.getState().i18n;
      store.dispatch(
        actions.notify({
          title: t(i18n, ["notification.see_you_soon.title"]),
          body: t(i18n, ["notification.see_you_soon.message"]),
        }),
      );
    }

    // hide, never destroy
    e.preventDefault();
    logger.info("Hiding main window");
    window.hide();
  });

  window.on("focus", (e: any) => {
    store.dispatch(actions.windowFocusChanged({ focused: true }));
  });

  window.on("blur", (e: any) => {
    store.dispatch(actions.windowFocusChanged({ focused: false }));
  });

  window.on("enter-full-screen", (e: any) => {
    if (!store.getState().ui.mainWindow.fullscreen) {
      store.dispatch(actions.windowFullscreenChanged({ fullscreen: true }));
    }
  });

  window.on("leave-full-screen", (e: any) => {
    if (store.getState().ui.mainWindow.fullscreen) {
      store.dispatch(actions.windowFullscreenChanged({ fullscreen: false }));
    }
  });

  window.on("maximize", (e: any) => {
    if (!store.getState().ui.mainWindow.maximized) {
      store.dispatch(actions.windowMaximizedChanged({ maximized: true }));
    }
  });

  window.on("unmaximize", (e: any) => {
    if (store.getState().ui.mainWindow.maximized) {
      store.dispatch(actions.windowMaximizedChanged({ maximized: false }));
    }
  });

  window.on("app-command", (e: any, cmd: AppCommand) => {
    switch (cmd) {
      case "browser-backward":
        store.dispatch(actions.triggerBrowserBack({}));
        break;
      case "browser-forward":
        store.dispatch(actions.triggerBrowserForward({}));
        break;
      default:
      // ignore unknown app commands
    }
  });

  const debouncedBounds = debounce(() => {
    if (window.isDestroyed()) {
      return;
    }
    const windowBounds = window.getBounds();
    store.dispatch(actions.windowBoundsChanged({ bounds: windowBounds }));
  }, 2000);

  window.on("move", (e: any) => {
    debouncedBounds();
  });

  window.on("resize", (e: any) => {
    debouncedBounds();
  });

  window.on("maximize", (e: any) => {
    config.set(MAXIMIZED_CONFIG_KEY, true);
  });

  window.on("unmaximize", (e: any) => {
    config.set(MAXIMIZED_CONFIG_KEY, false);
  });

  window.on("ready-to-show", async (e: any) => {
    if (env.name === "development") {
      try {
        await sf.stat(".cache");
        logger.warn("");
        logger.warn("####################################");
        logger.warn("# Did you forget to wipe '.cache'? #");
        logger.warn("#                                  #");
        logger.warn("# The app is running in dev, yet   #");
        logger.warn("# there is a '.cache' folder, so   #");
        logger.warn("# only precompiled sources will be #");
        logger.warn("# used.                            #");
        logger.warn("####################################");
        logger.warn("");
      } catch (e) {
        /* most probably ENOENT - which is good (in dev) */
      }
    }

    createLock = false;
    if (firstWindow) {
      firstWindow = false;
      store.dispatch(actions.firstWindowReady({}));
    }

    store.dispatch(actions.windowReady({ id: window.id }));

    if (hidden) {
      store.dispatch(actions.bounce({}));
    } else {
      showWindow(window);
    }
  });

  if (parseInt(process.env.DEVTOOLS, 10) > 0) {
    window.webContents.openDevTools({ mode: "detach" });
  }

  const rootDir = resolve(__dirname, "..");
  let uri = `file://${rootDir}/index.html`;
  if (process.env.ITCH_REACT_PERF === "1") {
    logger.info(`Enabling react perf`);
    uri += `?react_perf`;
  }
  window.loadURL(uri);
  if (env.name === "development") {
    window.emit("ready-to-show", {});
  }
}

/**
 * Make sure the window isn't outside the bounds of the screen,
 * cf. https://github.com/itchio/itch/issues/1051
 */
function ensureWindowInsideDisplay(window: Electron.BrowserWindow) {
  const originalBounds = window.getBounds();
  logger.debug(
    `Ensuring ${JSON.stringify(originalBounds)} is inside a display`,
  );

  const { screen } = require("electron");
  const display = screen.getDisplayMatching(originalBounds);
  if (!display) {
    logger.warn(`No display found matching ${JSON.stringify(originalBounds)}`);
    return;
  }

  const displayBounds = display.bounds;
  logger.debug(`Display bounds: ${JSON.stringify(displayBounds)}`);

  let bounds = originalBounds;

  const displayLeft = displayBounds.x;
  if (bounds.x < displayLeft) {
    bounds = { ...bounds, x: displayLeft };
  }

  const displayTop = displayBounds.y;
  if (bounds.y < displayTop) {
    bounds = { ...bounds, y: displayTop };
  }

  const displayRight = displayBounds.width + displayBounds.x;
  if (bounds.x + bounds.width > displayRight) {
    bounds = { ...bounds, x: displayRight - bounds.width };
  }

  const displayBottom = displayBounds.height + displayBounds.y;
  if (bounds.y + bounds.height > displayBottom) {
    bounds = { ...bounds, y: displayBottom - bounds.height };
  }

  if (bounds !== originalBounds) {
    logger.debug(`New bounds: ${JSON.stringify(bounds)}`);
    window.setBounds(bounds);
  }

  if (env.name === "test") {
    logger.info(
      `Main window is ${bounds.width}x${bounds.height}, at (${bounds.x}, ${bounds.y})`,
    );
  }
}

async function hideWindow() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.close();
  }
}

async function minimizeWindow() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.minimize();
  }
}

async function toggleMaximizeWindow() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
}

async function exitFullScreen() {
  const window = BrowserWindow.getFocusedWindow();
  if (window && window.isFullScreen()) {
    window.setFullScreen(false);
  }
}

function showWindow(window: Electron.BrowserWindow) {
  window.show();
  const maximized = config.get(MAXIMIZED_CONFIG_KEY) || false;
  if (maximized && !macOs) {
    window.maximize();
  }

  if (!maximized) {
    ensureWindowInsideDisplay(window);
  }
}

function ensureMainWindowInsideDisplay(store: IStore) {
  const id = store.getState().ui.mainWindow.id;
  if (!id) {
    return;
  }

  const window = BrowserWindow.fromId(id);
  if (!window) {
    return;
  }

  if (!window.isVisible()) {
    return;
  }

  ensureWindowInsideDisplay(window);
}

function updateTitle(store: IStore, title: string) {
  const id = store.getState().ui.mainWindow.id;
  if (!id) {
    return;
  }

  const window = BrowserWindow.fromId(id);
  if (!window) {
    return;
  }

  window.setTitle(title);
}

let titleSelector: (state: IAppState) => void;
const makeTitleSelector = (store: IStore) => {
  const getI18n = (state: IAppState) => state.i18n;

  const getID = (state: IAppState) => state.session.navigation.id;
  const getTabData = (state: IAppState) => state.session.tabData;
  const getData = createSelector(
    getID,
    getTabData,
    (id, tabData) => tabData[id],
  );

  return createSelector(getID, getData, getI18n, (id, data, i18n) => {
    const label = makeLabel(id, data);
    updateTitle(store, t(i18n, label) + " - itch");
  });
};

export default function(watcher: Watcher) {
  watcher.onAll(async (store, action) => {
    const state = store.getState();
    if (!titleSelector) {
      titleSelector = makeTitleSelector(store);
    }
    titleSelector(state);
  });

  watcher.on(actions.preferencesLoaded, async (store, action) => {
    const hidden = action.payload.openAsHidden;
    store.dispatch(actions.focusWindow({ hidden }));

    const { screen } = require("electron");
    screen.on("display-added", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-removed", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-metrics-changed", () =>
      ensureMainWindowInsideDisplay(store),
    );
  });

  watcher.on(actions.focusWindow, async (store, action) => {
    const id = store.getState().ui.mainWindow.id;
    const options = action.payload || {};

    if (id) {
      const window = BrowserWindow.fromId(id);
      invariant(window, "window still exists");
      if (options.toggle && window.isVisible()) {
        window.hide();
      } else {
        showWindow(window);
      }
    } else {
      await createWindow(store, action.payload.hidden);
    }
  });

  watcher.on(actions.hideWindow, async (store, action) => {
    hideWindow();
  });

  watcher.on(actions.minimizeWindow, async (store, action) => {
    minimizeWindow();
  });

  watcher.on(actions.toggleMaximizeWindow, async (store, action) => {
    toggleMaximizeWindow();
  });

  watcher.on(actions.triggerBack, async (store, action) => {
    exitFullScreen();
  });

  watcher.on(actions.windowBoundsChanged, async (store, action) => {
    // TODO: this should move to preferences, why are we using config again?
    const { bounds } = action.payload;
    config.set(BOUNDS_CONFIG_KEY, bounds);
  });

  watcher.on(actions.closeTabOrAuxWindow, async (store, action) => {
    const focused = BrowserWindow.getFocusedWindow();
    if (focused) {
      const id = store.getState().ui.mainWindow.id;
      if (focused.id === id) {
        store.dispatch(actions.closeCurrentTab({}));
      } else {
        focused.close();
      }
    }
  });

  watcher.on(actions.quitWhenMain, async (store, action) => {
    const mainId = store.getState().ui.mainWindow.id;
    const focused = BrowserWindow.getFocusedWindow();

    if (focused) {
      if (focused.id === mainId) {
        store.dispatch(actions.quit({}));
      } else {
        focused.close();
      }
    }
  });

  watcher.on(actions.quitElectronApp, async (store, action) => {
    app.quit();
  });

  watcher.on(actions.prepareQuit, async (store, action) => {
    quitting = true;
  });

  watcher.on(actions.quit, async (store, action) => {
    quitting = true;
    store.dispatch(actions.quitElectronApp({}));
  });

  watcher.on(actions.quitAndInstall, async (store, action) => {
    quitting = true;
    logger.info("Handing off to Squirrel for self-update");
    require("electron").autoUpdater.quitAndInstall();
  });
}
