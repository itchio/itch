
import {Watcher} from "./watcher";

import {createSelector} from "reselect";

import {makeLabel} from "../util/navigation";

import {darkMineShaft} from "../constants/colors";
import {app, BrowserWindow} from "electron";
import config from "../util/config";
import {getImagePath} from "../util/resources";
import os from "../util/os";
import {resolve} from "path";
import * as invariant from "invariant";
import {debounce} from "underscore";

import mklog from "../util/log";
const log = mklog("reactors/main-window");
import {opts} from "../logger";

import localizer from "../localizer";
import * as actions from "../actions";

let createLock = false;
let quitting = false;
let firstWindow = true;

const BOUNDS_CONFIG_KEY = "main_window_bounds";
const MAXIMIZED_CONFIG_KEY = "main_window_maximized";

const macOs = os.platform() === "darwin";

import {IAppState, IStore} from "../types";

async function createWindow (store: IStore, hidden: boolean) {
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
  const {width, height} = bounds;
  const center = (bounds.x === -1 && bounds.y === -1);
  let iconName = "icon";
  if (process.platform === "win32") {
    iconName = "icon-32";
  }

  const iconPath = getImagePath("window/" + app.getName() + "/" + iconName + ".png");
  log(opts, `creating main window with icon: ${iconPath}`);
  log(opts, "cf. https://github.com/electron/electron/issues/6205");

  const window = new BrowserWindow({
    title: app.getName(),
    icon: iconPath,
    width, height,
    center,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: darkMineShaft,
    titleBarStyle: "hidden",
  });

  if (os.platform() === "darwin") {
    try {
      log(opts, `setting icon to: ${iconPath}`);
      app.dock.setIcon(iconPath);
    } catch (err) {
      log(opts, `error setting icon: ${err.stack || err}`);
    }
  }

  if (!center) {
    window.setPosition(bounds.x, bounds.y);
  }
  ensureWindowInsideDisplay(window);

  window.on("close", (e: any) => {
    log(opts, "Main window being closed");
    if (quitting) {
      log(opts, "Quitting, letting main window close");
      // alright alright you get to close
      return;
    }

    const prefs = store.getState().preferences || {closeToTray: true};

    const {closeToTray} = prefs;
    if (closeToTray) {
      log(opts, "Close to tray enabled");
    } else {
      log(opts, "Close to tray disabled, quitting!");
      setTimeout(() => {
        store.dispatch(actions.quit({}));
      }, 100);
      return;
    }

    if (!window.isVisible()) {
      log(opts, "Main window hidden, letting it close");
      // timeout elapsed and still not shown - it's a closin'!
      return;
    }

    if (!prefs.gotMinimizeNotification) {
      store.dispatch(actions.updatePreferences({
        gotMinimizeNotification: true,
      }));

      const i18n = store.getState().i18n;
      const t = localizer.getT(i18n.strings, i18n.lang);
      store.dispatch(actions.notify({
        title: t("notification.see_you_soon.title"),
        body: t("notification.see_you_soon.message"),
      }));
    }

    // hide, never destroy
    e.preventDefault();
    log(opts, "Hiding main window");
    window.hide();
  });

  window.on("focus", (e: any) => {
    store.dispatch(actions.windowFocusChanged({focused: true}));
  });

  window.on("blur", (e: any) => {
    store.dispatch(actions.windowFocusChanged({focused: false}));
  });

  window.on("enter-full-screen", (e: any) => {
    store.dispatch(actions.windowFullscreenChanged({fullscreen: true}));
  });

  window.on("leave-full-screen", (e: any) => {
    store.dispatch(actions.windowFullscreenChanged({fullscreen: false}));
  });

  const debouncedBounds = debounce(() => {
    if (window.isDestroyed()) {
      return;
    }
    const windowBounds = window.getBounds();
    store.dispatch(actions.windowBoundsChanged({bounds: windowBounds}));
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

  window.on("ready-to-show", (e: any) => {
    log(opts, "Ready to show!");
    if (parseInt(process.env.DEVTOOLS, 10) > 0) {
      log(opts, "Opening devtools");
      window.webContents.openDevTools({mode: "detach"});
    } else {
      log(opts, "No devtools");
    }

    createLock = false;
    if (firstWindow) {
      firstWindow = false;
      log(opts, `Sending windowReady with id ${window.id}`);
      store.dispatch(actions.firstWindowReady({}));
    }

    store.dispatch(actions.windowReady({id: window.id}));

    if (hidden) {
      store.dispatch(actions.bounce({}));
    } else {
      showWindow(window);
    }
  });


  const rootDir = resolve(__dirname, "..");
  log(opts, `rootDir is ${rootDir}`);
  const uri = `file://${rootDir}/index.html`;
  log(opts, `Calling loadURL with ${uri}`);
  window.loadURL(uri);
}

/**
 * Make sure the window isn't outside the bounds of the screen,
 * cf. https://github.com/itchio/itch/issues/1051
 */
function ensureWindowInsideDisplay (window: Electron.BrowserWindow) {
  const originalBounds = window.getBounds();
  log(opts, `Ensuring ${JSON.stringify(originalBounds)} is inside a display`);

  const {screen} = require("electron");
  const display = screen.getDisplayMatching(originalBounds);
  if (!display) {
    log(opts, `No display found matching ${JSON.stringify(originalBounds)}`);
    return;
  }

  const displayBounds = display.bounds;
  log(opts, `Display bounds: ${JSON.stringify(displayBounds)}`);

  let bounds = originalBounds;

  const displayLeft = displayBounds.x;
  if (bounds.x < displayLeft) {
    log(opts, `Nudging right`);
    bounds = { ...bounds, x: displayLeft };
  }

  const displayTop = displayBounds.y;
  if (bounds.y < displayTop) {
    log(opts, `Nudging down`);
    bounds = { ...bounds, y: displayTop };
  }

  const displayRight = displayBounds.width + displayBounds.x;
  if (bounds.x + bounds.width > displayRight) {
    log(opts, `Nudging left`);
    bounds = { ...bounds, x: displayRight - bounds.width };
  }

  const displayBottom = displayBounds.height + displayBounds.y;
  if (bounds.y + bounds.height > displayBottom) {
    log(opts, `Nudging up`);
    bounds = { ...bounds, y: displayBottom - bounds.height };
  }

  if (bounds !== originalBounds) {
    log(opts, `New bounds: ${JSON.stringify(bounds)}`);
    window.setBounds(bounds);
  } else {
    log(opts, `Bounds unchanged: ${JSON.stringify(originalBounds)}`);
  }
}

async function hideWindow () {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.close();
  }
}

async function exitFullScreen () {
  const window = BrowserWindow.getFocusedWindow();
  if (window && window.isFullScreen()) {
    window.setFullScreen(false);
  }
}

function showWindow (window: Electron.BrowserWindow) {
  window.show();
  const maximized = config.get(MAXIMIZED_CONFIG_KEY) || false;
  if (maximized && !macOs) {
    window.maximize();
  }

  if (!maximized) {
    ensureWindowInsideDisplay(window);
  }
}

function ensureMainWindowInsideDisplay (store: IStore) {
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

function updateTitle (store: IStore, title: string) {
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
  const getLang = (state: IAppState) => state.i18n.lang;
  const getStrings = (state: IAppState) => state.i18n.strings;

  const getT = createSelector(
    getLang,
    getStrings,
    (lang, strings) => {
      return localizer.getT(strings, lang);
    },
  );

  const getID = (state: IAppState) => state.session.navigation.id;
  const getTabData = (state: IAppState) => state.session.navigation.tabData;

  return createSelector(
    getID,
    getTabData,
    getT,
    (id, tabData, t) => {
      const label = makeLabel(id, tabData);
      updateTitle(store, t.format(label) + " - itch");
    },
  );
};

export default function (watcher: Watcher) {
  watcher.onAll(async (store, action) => {
    const state = store.getState();
    if (!titleSelector) {
      titleSelector = makeTitleSelector(store);
    }
    titleSelector(state);
  });

  watcher.on(actions.preferencesLoaded, async (store, action) => {
    const hidden = action.payload.openAsHidden;
    store.dispatch(actions.focusWindow({hidden}));

    const {screen} = require("electron");
    screen.on("display-added", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-removed", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-metrics-changed", () => ensureMainWindowInsideDisplay(store));
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

  watcher.on(actions.triggerBack, async (store, action) => {
    exitFullScreen();
  });

  watcher.on(actions.windowBoundsChanged, async (store, action) => {
    // TODO: this should move to preferences, why are we using config again?
    const {bounds} = action.payload;
    config.set(BOUNDS_CONFIG_KEY, bounds);
  });

  watcher.on(actions.closeTabOrAuxWindow, async (store, action) => {
    const focused = BrowserWindow.getFocusedWindow();
    if (focused) {
      const id = store.getState().ui.mainWindow.id;
      if (focused.id === id) {
        store.dispatch(actions.closeTab({id: null}));
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
    log(opts, "Handing off to Squirrel for self-update");
    require("electron").autoUpdater.quitAndInstall();
  });
}
