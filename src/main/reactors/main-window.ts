import { Watcher } from "common/util/watcher";

import { createSelector } from "reselect";
import { format as formatUrl, UrlObject } from "url";
import * as path from "path";

import env from "common/env";

import { darkMineShaft } from "common/constants/colors";
import { app, BrowserWindow } from "electron";
import config from "common/util/config";
import * as os from "../os";
import { debounce } from "underscore";

import rootLogger from "common/logger";
const logger = rootLogger.child({ name: "main-window" });

import { actions } from "common/actions";

let createLock = false;
let firstWindow = true;

type AppCommand = "browser-backward" | "browser-forward";

const BOUNDS_CONFIG_KEY = "main_window_bounds";
const MAXIMIZED_CONFIG_KEY = "main_window_maximized";

const macOs = os.platform() === "darwin";

import { IRootState, IStore } from "common/types";
import { Space } from "common/helpers/space";
import { openAppDevTools } from "./open-app-devtools";
import { t } from "common/format/t";
import { getImagePath } from "common/util/resources";
import { stringify } from "querystring";

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

  let opts: Electron.BrowserWindowConstructorOptions = {
    title: app.getName(),
    icon: getIconPath(),
    width,
    height,
    center,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: darkMineShaft,
    titleBarStyle: "hidden",
    frame: false,
    webPreferences: {
      blinkFeatures: "ResizeObserver",
      webSecurity: env.development ? false : true,
    },
  };
  store.dispatch(
    actions.windowOpened({
      window: "root",
    })
  );
  const window = new BrowserWindow(opts);

  if (os.platform() === "darwin") {
    try {
      app.dock.setIcon(getIconPath());
    } catch (err) {
      logger.warn(`Could not set dock icon: ${err.stack}`);
    }
  }

  if (!center) {
    window.setPosition(bounds.x, bounds.y);
  }
  ensureWindowInsideDisplay(window);

  window.on("close", (e: any) => {
    const prefs = store.getState().preferences || { closeToTray: true };

    let { closeToTray } = prefs;
    if (env.integrationTests) {
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
      return;
    }

    if (!prefs.gotMinimizeNotification) {
      store.dispatch(
        actions.updatePreferences({
          gotMinimizeNotification: true,
        })
      );

      const i18n = store.getState().i18n;
      store.dispatch(
        actions.notify({
          title: t(i18n, ["notification.see_you_soon.title"]),
          body: t(i18n, ["notification.see_you_soon.message"]),
        })
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

  window.on("leave-full-screen", e => {
    if (store.getState().ui.mainWindow.fullscreen) {
      store.dispatch(actions.windowFullscreenChanged({ fullscreen: false }));
    }
  });

  window.on("maximize", e => {
    if (!store.getState().ui.mainWindow.maximized) {
      store.dispatch(actions.windowMaximizedChanged({ maximized: true }));
    }
  });

  window.on("unmaximize", e => {
    if (store.getState().ui.mainWindow.maximized) {
      store.dispatch(actions.windowMaximizedChanged({ maximized: false }));
    }
  });

  window.on("app-command", (e, cmd) => {
    switch (cmd as AppCommand) {
      case "browser-backward":
        store.dispatch(
          actions.commandGoBack({
            window: "root",
          })
        );
        break;
      case "browser-forward":
        store.dispatch(
          actions.commandGoForward({
            window: "root",
          })
        );
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

  window.loadURL(makeAppURL({ id: "root" }));

  if (parseInt(process.env.DEVTOOLS || "0", 10) > 0) {
    await openAppDevTools(window);
  }
}

/**
 * Make sure the window isn't outside the bounds of the screen,
 * cf. https://github.com/itchio/itch/issues/1051
 */
function ensureWindowInsideDisplay(window: Electron.BrowserWindow) {
  const originalBounds = window.getBounds();
  logger.debug(
    `Ensuring ${JSON.stringify(originalBounds)} is inside a display`
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

let secondaryWindowSeed = 1;

export default function(watcher: Watcher) {
  watcher.onStateChange({
    makeSelector: (store, schedule) => {
      const getI18n = (rs: IRootState) => rs.i18n;
      const getID = (rs: IRootState) => rs.windows["root"].navigation.tab;
      const getTabInstance = (rs: IRootState) =>
        rs.windows["root"].tabInstances;

      const getSpace = createSelector(getID, getTabInstance, (id, tabData) =>
        Space.fromInstance(tabData[id])
      );

      return createSelector(getI18n, getSpace, (i18n, sp) => {
        updateTitle(store, t(i18n, sp.label()) + " - itch");
      });
    },
  });

  watcher.on(actions.preferencesLoaded, async (store, action) => {
    const hidden = action.payload.openAsHidden;
    store.dispatch(actions.focusWindow({ hidden }));

    const { screen } = require("electron");
    screen.on("display-added", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-removed", () => ensureMainWindowInsideDisplay(store));
    screen.on("display-metrics-changed", () =>
      ensureMainWindowInsideDisplay(store)
    );
  });

  watcher.on(actions.focusWindow, async (store, action) => {
    const id = store.getState().ui.mainWindow.id;
    const options = action.payload || {};

    if (id) {
      const window = BrowserWindow.fromId(id);
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

  watcher.on(actions.commandBack, async (store, action) => {
    exitFullScreen();
  });

  watcher.on(actions.windowBoundsChanged, async (store, action) => {
    const { bounds } = action.payload;
    config.set(BOUNDS_CONFIG_KEY, bounds);
  });

  watcher.on(actions.closeTabOrAuxWindow, async (store, action) => {
    const { window } = action.payload;
    const focused = BrowserWindow.getFocusedWindow();
    if (focused) {
      const id = store.getState().ui.mainWindow.id;
      if (focused.id === id) {
        store.dispatch(actions.closeCurrentTab({ window }));
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

  watcher.on(actions.quit, async (store, action) => {
    app.exit(0);
  });

  watcher.on(actions.openWindow, async (store, action) => {
    const { tab, modal } = action.payload;

    const mainId = store.getState().ui.mainWindow.id;
    const childWindow = new BrowserWindow({
      title: app.getName(),
      icon: getIconPath(),
      parent: modal ? BrowserWindow.fromId(mainId) : null,
      modal,
      autoHideMenuBar: true,
      backgroundColor: darkMineShaft,
      titleBarStyle: "hidden",
      frame: false,
      webPreferences: {
        blinkFeatures: "ResizeObserver",
        webSecurity: env.development ? false : true,
      },
    });
    const id = `secondary-${secondaryWindowSeed++}`;
    store.dispatch(
      actions.windowOpened({
        window: id,
      })
    );
    store.dispatch(
      actions.navigate({
        window: id,
        url: tab,
      })
    );
    childWindow.loadURL(makeAppURL({ id, tab }));
  });
}

interface AppURLParams {
  id: string;
  tab?: string;
}

function makeAppURL(params: AppURLParams): string {
  let urlObject: UrlObject;
  if (env.development) {
    urlObject = {
      pathname: "/",
      protocol: "http",
      hostname: "localhost",
      port: process.env.ELECTRON_WEBPACK_WDS_PORT,
    };
  } else {
    urlObject = {
      pathname: path.resolve(__dirname, "..", "renderer", "index.html"),
      protocol: "file",
      slashes: true,
    };
  }
  urlObject.search = stringify(params);

  const result = formatUrl(urlObject);
  console.log(`formatted URL: ${result}`);
  return result;
}

function getIconPath(): string {
  let iconName = "icon";
  if (process.platform === "win32") {
    iconName = "icon-32";
  }

  return getImagePath("window/" + env.appName + "/" + iconName + ".png");
}
