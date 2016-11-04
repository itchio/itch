
import {darkMineShaft} from "../constants/colors";
import {app, BrowserWindow} from "../electron";
import config from "../util/config";
import os from "../util/os";
import * as ospath from "path";
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

import {IStore} from "../types/db";
import {
  IAction,
  IWindowBoundsChangedPayload,
  IFocusWindowPayload,
  IQuitAndInstallPayload,
  IBootPayload,
} from "../constants/action-types";

async function createWindow (store: IStore) {
  if (createLock) {
    return;
  }
  createLock = true;

  const userBounds = config.get(BOUNDS_CONFIG_KEY) || {};
  const bounds = Object.assign({}, {
    x: -1,
    y: -1,
    width: 1250,
    height: 720,
  }, userBounds);
  const {width, height} = bounds;
  const center = (bounds.x === -1 && bounds.y === -1);
  const iconPath = ospath.resolve(`${__dirname}/../static/images/window/${app.getName()}/icon.png`);
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

  let destroyTimeout: NodeJS.Timer;

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
        store.dispatch(actions.quit());
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

    // hide, only destroy after slight delay
    e.preventDefault();
    log(opts, "Hiding main window for a while..");
    window.hide();

    destroyTimeout = setTimeout(() => {
      if (window.isDestroyed()) {
        log(opts, "Window already destroyed!");
        return;
      }

      try {
        if (!window.isVisible()) {
          window.close();
        }
      } catch (e) {
        log(opts, `While attempting to destroy window: ${e.message}`);
      }
    }, 10 * 1000);
  });

  window.on("closed", (e: any) => {
    store.dispatch(actions.windowDestroyed());
  });

  window.on("focus", (e: any) => {
    if (destroyTimeout) {
      log(opts, "Got focused, clearing destroy timeout");
      clearTimeout(destroyTimeout);
      destroyTimeout = null;
    }
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
      window.webContents.openDevTools({detach: true});
    } else {
      log(opts, "No devtools");
    }

    createLock = false;
    if (firstWindow) {
      firstWindow = false;
      log(opts, `Sending windowReady with id ${window.id}`);
      store.dispatch(actions.firstWindowReady({id: window.id}));
    }

    store.dispatch(actions.windowReady({id: window.id}));
    showWindow(window);
  });

  const uri = `file://${__dirname}/../index.html`;
  window.loadURL(uri);
  log(opts, "Calling loadURL");
}

async function windowBoundsChanged (store: IStore, action: IAction<IWindowBoundsChangedPayload>) {
  // TODO: this should move to preferences, why are we using config again?
  const {bounds} = action.payload;
  config.set(BOUNDS_CONFIG_KEY, bounds);
}

async function focusWindow (store: IStore, action: IAction<IFocusWindowPayload>) {
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
    await createWindow(store);
  }
}

async function hideWindow (store: IStore) {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.close();
  }
}

async function closeTabOrAuxWindow (store: IStore) {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused) {
    const id = store.getState().ui.mainWindow.id;
    if (focused.id === id) {
      store.dispatch(actions.closeTab());
    } else {
      focused.close();
    }
  }
}

async function quitWhenMain (store: IStore) {
  const mainId = store.getState().ui.mainWindow.id;
  const focused = BrowserWindow.getFocusedWindow();

  if (focused) {
    if (focused.id === mainId) {
      store.dispatch(actions.quit());
    } else {
      focused.close();
    }
  }
}

// TODO: type window? electron typings aren't really cooperating with our
// whole fake-electron thing for testing.
function showWindow (window: any) {
  window.show();
  const maximized = config.get(MAXIMIZED_CONFIG_KEY) || false;
  if (maximized && !macOs) {
    window.maximize();
  }
}

async function quitElectronApp () {
  app.quit();
}

async function prepareQuit () {
  quitting = true;
}

async function quit (store: IStore) {
  quitting = true;
  store.dispatch(actions.quitElectronApp());
}

async function quitAndInstall (store: IStore, action: IAction<IQuitAndInstallPayload>) {
  quitting = true;
  log(opts, "Handing off to Squirrel");
  require("electron").autoUpdater.quitAndInstall();
}

async function boot (store: IStore, action: IAction<IBootPayload>) {
  await focusWindow(store, action);
}

export default {
  boot, focusWindow, hideWindow, windowBoundsChanged,
  closeTabOrAuxWindow, quitWhenMain, quitElectronApp, prepareQuit, quit, quitAndInstall,
};
